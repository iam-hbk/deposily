import { Separator } from "@/components/ui/separator";
import Image from "next/image";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className=" flex flex-row items-center justify-center h-svh">
      <Image
        src={"/logo-with-text.svg"}
        alt="deposily-logo"
        width={120}
        height={120}
        className="m-5 dark:filter dark:grayscale dark:invert"
      />
      <Separator orientation="vertical" className="max-h-[50svh] mx-20" />
      <div>{children}</div>
    </div>
  );
}
