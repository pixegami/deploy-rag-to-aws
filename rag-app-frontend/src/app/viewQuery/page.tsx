"use client";

import { QueryModel } from "@/api-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import createApiClient from "@/lib/getApiClient";
import { ArrowLeft, Link2, Loader } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ViewQueryPage() {
  const searchParams = useSearchParams();
  const queryId = searchParams.get("query_id");
  const api = createApiClient();
  const [queryItem, setQueryItem] = useState<QueryModel>();

  // Create a hook to call the API.
  useEffect(() => {
    const fetchData = async () => {
      try {
        const request = {
          queryId: queryId!,
        };
        const response = api.getQueryEndpointGetQueryGet(request);
        response.then((data) => {
          console.log(data);
          setQueryItem(data);
        });
        console.log(`Got data: ${response}`);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  let viewQueryElement;

  if (!queryItem) {
    viewQueryElement = (
      <div>
        <div className="space-y-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  } else {
    if (!queryItem.sources) {
      queryItem.sources = [];
    }
    const sourcesElement = queryItem.sources!.map((source) => {
      return (
        <Link key={source} href={`/source/${source}`}>
          <div className="text-xs flex text-slate-500 hover:underline">
            <Link2 className="mr-2 h-4 w-4" />
            {source}
          </div>
        </Link>
      );
    });

    const isComplete = queryItem.isComplete;
    const answerElement = isComplete ? (
      <>
        <div className="font-bold">Response</div>
        {queryItem?.answerText}
        <div className="mt-4">{sourcesElement}</div>
      </>
    ) : (
      <div className="text-slate-500 flex">
        <Loader className="h-4 w-4 mr-2 my-auto" />
        Still loading. Please try again later.
      </div>
    );

    queryItem.answerText || "Query still in progress. Please wait...";

    // Displayed Element.
    viewQueryElement = (
      <>
        <div className="bg-blue-100 text-blue-800 p-3 rounded-sm">
          <div className="font-bold">Question</div>
          {queryItem?.queryText}
        </div>
        <div className="bg-slate-100 text-slate-700  p-3 rounded-sm">
          {answerElement}
        </div>
      </>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>View Query</CardTitle>
          <CardDescription>Query ID: {queryId}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {viewQueryElement}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href="/">
            <Button variant="outline">
              {" "}
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </>
  );
}
