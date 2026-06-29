import React from "react";

export default function Script(props: { src?: string; [key: string]: unknown }) {
  return <script {...props} />;
}
