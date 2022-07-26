# 🍯 **React Honey Hooks**

A React Hooks version of the Honey Hooks library

> #### 🌴 **Support Tree Shaking**

<br/>

#### **Hooks available**:

-   <a href="#use-query">useQuery</a>
-   <a href="#use-count-down-date">useCountDownDate</a>

#### **Next Hooks**

-   🔥 useTranslate
-   🔥 useMouse

<br/>

#### **Content Table**

-   <a href="#use-query">useQuery</a>
-   <a href="#use-count-down-date">useCountDownDate</a>

<br/>

<div id="use-query"><h4><b>🍯 useQuery</b></h4></div>
<br/>

```
- First we navigate to the page
- Example: https://example.com?query=value
- Then we use the hook to get the query value
```

### Javascript

```javascript
// ES5
var useQuery = require("react-honey-hooks").useQuery;
var query = useQuery();
console.log(query); // {query: "value"}
// or
var honey = require("react-honey-hooks");
var query = honey.useQuery();
console.log(query); // {query: "value"}
// ES6
import { useQuery } from "react-honey-hooks";
function Example() {
    const { query } = useQuery(); // {query: "value"}
    return (
        <>
            <h3> 🍯 useQury:</h3>
            <p>Query value: {JSON.stringify({ query }, null, 2)}</p>
        </>
    );
}
```

### TypeScript

```typescript
import { useQuery, ParamsType } from "react-honey-hooks";
function Example() {
    const { query } = useQuery<ParamsType>(); // {query: "value"}
    return (
        <>
            <h3>useQury: 🍯</h3>
            <p>Query value: {JSON.stringify({ query }, null, 2)}</p>
        </>
    );
}
```

<br/>

<div id="use-down-count-date"><h4><b>🍯 useCountDownDate</b></h4></div>
<br/>

### JavaScript

```javascript
import { useCountdownDate } from "react-honey-hooks";
function Example() {
    const { days, hours, minutes, seconds } = useCountdownDate(Date.now()); // {days: 0, hours: 0, minutes: 0, seconds: 0}
    return (
        <>
            <h3> 🍯 useCountdownDate:</h3>
            <p>DownCount Date value: {JSON.stringify({ days, hours, minutes, seconds }, null, 2)}</p>
        </>
    );
}
```

### TypeScript

```typescript
import { useCountdownDate, DownCountDateType } from "react-honey-hooks";
function Example() {
    const { days, hours, minutes, seconds }: DownCountDateType = useCountdownDate(Date.now()); // {days: 0, hours: 0, minutes: 0, seconds: 0}
    return (
        <>
            <h3> 🍯 useCountdownDate:</h3>
            <p>DownCount Date value: {JSON.stringify({ days, hours, minutes, seconds }, null, 2)}</p>
        </>
    );
}
```
