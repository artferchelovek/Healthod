import { useEffect } from "react";
import { api } from "@/logic/api.ts";

export default function Profile() {
  useEffect(() => {
    const test = async () => {
      const res = await api("/auth/me");
      console.log(res.data);
    };

    test();
  }, []);

  return (
    <>
      <p>секс</p>
    </>
  );
}
