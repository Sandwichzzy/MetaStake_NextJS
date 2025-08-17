"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Header = () => {
  const links = [
    {
      name: "Home",
      path: "/",
    },
    {
      name: "Withdraw",
      path: "/withdraw",
    },
  ];
  const pathname = usePathname();
  return (
    <div className="flex justify-between items-center p-4 bg-black text-white">
      <div className="text-2xl font-bold ml-4">MetaStake</div>
      <div className="flex gap-4 items-center">
        {links.map((link) => {
          const active = pathname === link.path || pathname === link.path + "/";
          return (
            <Link
              key={link.name}
              href={link.path}
              className={`${
                active ? "text-white " : "text-gray-500"
              } hover:text-blue-500 font-bold text-2xl transition-colors duration-300`}
            >
              {link.name}
            </Link>
          );
        })}
      </div>
      <div className="mr-4">
        <ConnectButton />
      </div>
    </div>
  );
};

export default Header;
