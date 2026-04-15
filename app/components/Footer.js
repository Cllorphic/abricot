import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Image
          src="/images/BlackLogo.svg"
          alt="Abricot"
          width={100}
          height={28}
        />
        <p className="text-sm text-gray-400">Abricot 2025</p>
      </div>
    </footer>
  );
}