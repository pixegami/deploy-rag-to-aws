"use client";

import QueryList from "@/components/app/queryList";
import SubmitQueryForm from "@/components/app/submitQueryForm";

export default function Home() {
  return (
    <>
      <SubmitQueryForm></SubmitQueryForm>
      <QueryList></QueryList>
    </>
  );
}
