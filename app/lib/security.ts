import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export async function checkUserPermissions(userId: string, resourceId: string, resourceType: string) {
  const supabase = createClientComponentClient();
  
  const { data: permissions, error } = await supabase
    .from('user_permissions')
    .select('*')
    .eq('user_id', userId)
    .eq('resource_id', resourceId)
    .eq('resource_type', resourceType)
    .single();

  if (error) {
    console.error('Error checking permissions:', error);
    return false;
  }

  return permissions !== null;
}

export function sanitizeInput(input: string): string {
  // Remove potentially dangerous HTML tags
  return input.replace(/<[^>]*>/g, '');
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
} 