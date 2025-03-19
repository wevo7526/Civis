import Image from 'next/image';
import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/" className="flex items-center space-x-2">
      <Image
        src="/civislogo.png"
        alt="Civis Logo"
        width={32}
        height={32}
        priority
        className="w-auto h-auto"
      />
      <span className="text-xl font-bold text-gray-900">Civis</span>
    </Link>
  );
} 