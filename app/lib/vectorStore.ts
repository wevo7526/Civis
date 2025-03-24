import { createClient } from '@supabase/supabase-js';
import { CohereClient } from 'cohere-ai';

interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    documentId: string;
    title: string;
    type: string;
    page?: number;
    section?: string;
  };
  embedding: number[];
}

interface EmbeddingResponse {
  embeddings: number[][];
}

interface CohereEmbedResponse {
  embeddings: {
    [key: string]: number[];
  };
  meta: {
    api_version: {
      version: string;
    };
  };
}

export class VectorStore {
  private supabase;
  private cohere;
  private lastRequestTime = 0;
  private MIN_REQUEST_INTERVAL = 100; // 100ms between requests
  private MAX_RETRIES = 3;
  private INITIAL_RETRY_DELAY = 1000;

  constructor() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Supabase environment variables are not set');
    }

    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    if (!process.env.COHERE_API_KEY) {
      throw new Error('Cohere API key is not set');
    }

    this.cohere = new CohereClient({
      token: process.env.COHERE_API_KEY,
    });
  }

  private sanitizeText(text: string): string {
    // Remove null characters and other problematic Unicode characters
    return text
      .replace(/\u0000/g, '') // Remove null characters
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .replace(/\u200B/g, '') // Remove zero-width spaces
      .trim();
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      await this.delay(this.MIN_REQUEST_INTERVAL - timeSinceLastRequest);
    }
    this.lastRequestTime = Date.now();
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    retries = this.MAX_RETRIES,
    delay = this.INITIAL_RETRY_DELAY
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries === 0) throw error;
      await this.delay(delay);
      return this.retryWithBackoff(operation, retries - 1, delay * 2);
    }
  }

  private async getEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      await this.waitForRateLimit();
      
      const response = await this.retryWithBackoff(() =>
        this.cohere.embed({
          texts,
          model: 'embed-english-v3.0',
          inputType: 'search_document',
        })
      );

      if (!response || !response.embeddings) {
        throw new Error('Invalid response from Cohere API');
      }

      // Convert the response embeddings to the expected format
      const embeddings = response.embeddings as unknown as { [key: string]: number[] };
      return Object.values(embeddings);
    } catch (error) {
      console.error('Error getting embeddings:', error);
      throw error;
    }
  }

  async storeDocument(document: { content: string; title: string; type: string }) {
    try {
      console.log('Starting document storage process...');
      console.log('Document title:', document.title);
      console.log('Document type:', document.type);
      
      // Sanitize the document content
      const sanitizedContent = this.sanitizeText(document.content);
      console.log('Content sanitized, length:', sanitizedContent.length);

      // Split into chunks
      const chunks = this.splitIntoChunks(sanitizedContent);
      console.log(`Split document into ${chunks.length} chunks`);

      // Generate embeddings
      console.log('Generating embeddings...');
      const embeddings = await this.getEmbeddings(chunks);
      console.log(`Generated ${embeddings.length} embeddings`);

      // Verify embeddings
      if (!embeddings || embeddings.length === 0) {
        throw new Error('Failed to generate embeddings');
      }

      // Store chunks in Supabase
      console.log('Storing chunks in Supabase...');
      const chunksToInsert = chunks.map((chunk, i) => ({
        id: `${document.title}-${i}-${Date.now()}`, // Generate unique ID for each chunk
        content: chunk,
        metadata: {
          title: document.title,
          type: document.type,
          chunk_index: i,
        },
        embedding: embeddings[i],
      }));

      console.log('Prepared chunks for insertion:', chunksToInsert.length);
      
      const { data, error: insertError } = await this.supabase
        .from('document_chunks')
        .insert(chunksToInsert)
        .select();

      if (insertError) {
        console.error('Error inserting chunks:', insertError);
        throw insertError;
      }

      console.log('Successfully stored document chunks:', data?.length);
      return true;
    } catch (error) {
      console.error('Error in storeDocument:', error);
      throw error;
    }
  }

  async searchSimilar(query: string, matchThreshold = 0.5, matchCount = 5) {
    try {
      console.log('Starting similarity search...');
      console.log('Query:', query);
      console.log('Match threshold:', matchThreshold);
      console.log('Match count:', matchCount);
      
      // Sanitize the query
      const sanitizedQuery = this.sanitizeText(query);
      console.log('Query sanitized, length:', sanitizedQuery.length);

      // Generate query embedding
      console.log('Generating query embedding...');
      const queryEmbedding = await this.getEmbeddings([sanitizedQuery]);
      console.log('Query embedding generated successfully');

      if (!queryEmbedding || queryEmbedding.length === 0) {
        throw new Error('Failed to generate query embedding');
      }

      // Verify the embedding dimensions
      console.log('Query embedding dimensions:', queryEmbedding[0].length);

      // First, let's check if we have any documents in the table
      const { count, error: countError } = await this.supabase
        .from('document_chunks')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Error checking document count:', countError);
        throw countError;
      }

      console.log('Total documents in database:', count);

      // Search for similar chunks in Supabase
      console.log('Searching for similar chunks in Supabase...');
      const { data, error } = await this.supabase
        .rpc('match_documents', {
          query_embedding: queryEmbedding[0],
          match_threshold: matchThreshold,
          match_count: matchCount
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Search results:', data);
      
      if (!data || data.length === 0) {
        // If no results, try a lower threshold
        console.log('No results found with current threshold, trying lower threshold...');
        const { data: lowerThresholdData, error: lowerError } = await this.supabase
          .rpc('match_documents', {
            query_embedding: queryEmbedding[0],
            match_threshold: 0.3, // Try a much lower threshold
            match_count: matchCount
          });

        if (lowerError) {
          console.error('Error with lower threshold search:', lowerError);
          throw lowerError;
        }

        console.log('Results with lower threshold:', lowerThresholdData);
        
        if (!lowerThresholdData || lowerThresholdData.length === 0) {
          console.log('No similar chunks found even with lower threshold');
          return [];
        }

        return lowerThresholdData.map((chunk: any) => ({
          content: chunk.content,
          metadata: chunk.metadata,
          similarity: chunk.similarity,
        }));
      }

      return data.map((chunk: any) => ({
        content: chunk.content,
        metadata: chunk.metadata,
        similarity: chunk.similarity,
      }));
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }

  private splitIntoChunks(text: string, chunkSize = 1000, overlap = 200): string[] {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > chunkSize) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += ' ' + sentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
} 