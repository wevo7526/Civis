import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Version {
  id: string;
  version_number: number;
  content: string;
  title: string;
  created_at: string;
  metadata: {
    status: string;
    type: string;
    project_id: string;
  };
}

interface VersionHistoryProps {
  writingItemId: string;
  isOpen: boolean;
  onClose: () => void;
  onRestoreVersion: (version: Version) => void;
}

export default function VersionHistory({
  writingItemId,
  isOpen,
  onClose,
  onRestoreVersion,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (isOpen) {
      fetchVersions();
    }
  }, [isOpen, writingItemId]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('writing_versions')
        .select('*')
        .eq('writing_item_id', writingItemId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch versions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-4xl bg-white rounded-xl shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Version History
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="px-6 py-4 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="px-6 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No version history available
              </div>
            ) : (
              <div className="space-y-4">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          Version {version.version_number}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(version.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <div className="font-medium">{version.title}</div>
                      <div className="mt-1 line-clamp-2">{version.content}</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Status: {version.metadata.status}</span>
                      <span>•</span>
                      <span>Type: {version.metadata.type}</span>
                    </div>
                    <button
                      onClick={() => onRestoreVersion(version)}
                      className="mt-3 text-sm text-purple-600 hover:text-purple-800"
                    >
                      Restore this version
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 