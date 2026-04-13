import Link from 'next/link';

export default function Header() {
  return (
    <header>
      <nav>
        <Link href="/dashboard">Dashboard</Link> |{' '}
        <Link href="/projects">Projects</Link> |{' '}
        <Link href="/profile">Profile</Link>
      </nav>
    </header>
  );
}