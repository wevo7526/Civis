import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  HomeIcon,
  ChartBarIcon,
  UserGroupIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  ArrowRightOnRectangleIcon,
  MegaphoneIcon,
  DocumentDuplicateIcon,
  LightBulbIcon,
  FolderIcon,
  DocumentCheckIcon,
  SparklesIcon,
  UserIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useState, useEffect } from 'react';
import Image from 'next/image';

const navigation = [
  {
    name: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
      { name: 'Knowledge', href: '/dashboard/ai-chat', icon: ChatBubbleLeftRightIcon },
      { name: 'Projects', href: '/dashboard/projects', icon: FolderIcon },
      { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon },
    ],
  },
  {
    name: 'Automation',
    items: [
      { name: 'Hub', href: '/dashboard/automation', icon: Cog6ToothIcon },
      { name: 'Donors', href: '/dashboard/automation/donor-communications', icon: EnvelopeIcon },
      { name: 'Grants', href: '/dashboard/grants', icon: BellIcon },
      { name: 'Impact', href: '/dashboard/automation/impact-reports', icon: DocumentTextIcon },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className={`flex flex-col h-screen bg-white border-r transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex items-center justify-between h-16 px-4">
        {!isCollapsed && (
          <Image
            src="/civislogo.png"
            alt="Civis"
            width={120}
            height={32}
            className="h-8 w-auto"
          />
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-2 rounded-md hover:bg-gray-100 ${isCollapsed ? 'mx-auto' : ''}`}
        >
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>
      
      <nav className="flex-1 px-2 py-4 space-y-6 overflow-y-auto">
        {navigation.map((section) => (
          <div key={section.name}>
            {!isCollapsed && (
              <h2 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.name}
              </h2>
            )}
            <div className="mt-2 space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon
                      className={`h-5 w-5 flex-shrink-0 ${
                        isActive ? 'text-blue-700' : 'text-gray-400'
                      }`}
                      aria-hidden="true"
                    />
                    {!isCollapsed && <span className="ml-3">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto p-4 space-y-2">
        <Link
          href="/dashboard/profile"
          className={`flex items-center w-full px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors duration-200 ${
            pathname === '/dashboard/profile' ? 'bg-blue-50 text-blue-700' : ''
          } ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? 'Profile' : undefined}
        >
          <UserCircleIcon className={`h-5 w-5 flex-shrink-0 ${
            pathname === '/dashboard/profile' ? 'text-blue-700' : 'text-gray-400'
          }`} />
          {!isCollapsed && <span className="ml-3">Profile</span>}
        </Link>
        <Link
          href="/dashboard/account"
          className={`flex items-center w-full px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors duration-200 ${
            pathname === '/dashboard/account' ? 'bg-blue-50 text-blue-700' : ''
          } ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? 'Account' : undefined}
        >
          <CreditCardIcon className={`h-5 w-5 flex-shrink-0 ${
            pathname === '/dashboard/account' ? 'text-blue-700' : 'text-gray-400'
          }`} />
          {!isCollapsed && <span className="ml-3">Account</span>}
        </Link>
        <button
          onClick={handleSignOut}
          className={`flex items-center w-full px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors duration-200 ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Sign out' : undefined}
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
          {!isCollapsed && <span className="ml-3">Sign out</span>}
        </button>
      </div>
    </div>
  );
} 