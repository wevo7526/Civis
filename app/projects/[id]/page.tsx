import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import ProjectClient from './ProjectClient';
import { NextPageProps } from '@/app/lib/types';

export default async function ProjectPage({ params, searchParams }: NextPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const supabase = createServerComponentClient({ cookies });
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', resolvedParams.id)
    .single();

  if (!project) {
    notFound();
  }

  return <ProjectClient project={project} projectId={resolvedParams.id} />;
} 