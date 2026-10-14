"use client";

import { useEffect, useState } from "react";

export default function BlogCustomContent({
  content,
  styles,
}: {
  content: string;
  styles: string;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="min-h-[420px] bg-white" aria-hidden="true" />;
  }

  return (
    <div className="overflow-hidden">
      {styles && <style dangerouslySetInnerHTML={{ __html: styles }} />}
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}
