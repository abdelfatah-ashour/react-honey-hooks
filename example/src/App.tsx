import React from "react"
import { useQuery } from "react-honey-hooks"

export default function App() {
  const queries = useQuery()
  return (
    <div>
      <h1>Hello, world!</h1>
      <pre>{JSON.stringify(queries, null, 2)}</pre>
    </div>
  )
}
