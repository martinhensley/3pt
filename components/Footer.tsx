"use client";

interface FooterProps {
  rounded?: boolean;
}

export default function Footer({ rounded = true }: FooterProps) {
  return (
    <footer className={`bg-gradient-to-r from-footy-green to-green-700 text-white shadow-lg ${rounded ? 'rounded-xl' : ''}`}>
      <div className="px-6 py-8 text-center">
        <p className="text-sm">
          <span className="text-white">footy</span><span className="text-footy-orange">.bot</span> © 2024-{new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
