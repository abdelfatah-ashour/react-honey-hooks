# 🍯 **React Honey Hooks**

A React Hooks version of the Honey Hooks library

> #### 🌴 **Support Tree Shaking**

<br/>

#### **Hooks available**:

- **<a href="#use-query">useQuery</a>**
- **<a href="#use-count-down-date">useCountDownDate</a>**
- **<a href="use-out-side-element">useOutsideElement</a>**

#### **Next Hooks**

- 🔥 useTranslate
- 🔥 useMouse

<br/>

#### **Content Table**

- <a href="#use-query">useQuery</a>
- <a href="#use-count-down-date">useCountDownDate</a>
- <a href="#use-out-side-element">useOutsideElement</a>

<br/>

<h3 id="use-query"><b>🍯 useQuery</b></h3>
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

// https://abc.com?query=value
console.log(query); // {query: "value"}

// or

var honey = require("react-honey-hooks");

var query = honey.useQuery();
// https://abc.com?query=value
console.log(query); // {query: "value"}

// ES6
import { useQuery } from "react-honey-hooks";
function Example() {
  // https://abc.com?query=value
  const query = useQuery();
  console.log(query); // {query: "value"}

  return (
    <>
      <h3> 🍯 useQuery:</h3>
      <p>Query value: {JSON.stringify({ query }, null, 2)}</p>
    </>
  );
}
```

### TypeScript

```typescript
import { useQuery, ParamsType } from "react-honey-hooks";
function Example() {
  const query = useQuery<ParamsType>(); // {query: "value"}
  return (
    <>
      <h3>useQuery: 🍯</h3>
      <p>Query value: {JSON.stringify(query, null, 2)}</p>
    </>
  );
}
```

<br/>

<h3 id="use-count-down-date"><b>🍯 useCountDownDate</b></h3>
<br/>

### JavaScript

```javascript
import { useCountdownDate } from "react-honey-hooks";
function Example() {
  const countDown = useCountdownDate(Date.now()); // {days: 0, hours: 0, minutes: 0, seconds: 0}
  return (
    <>
      <h3> 🍯 useCountdownDate:</h3>
      <p>DownCount Date value: {JSON.stringify(countDown, null, 2)}</p>
    </>
  );
}
```

### TypeScript

```typescript
import { useCountdownDate, DownCountDateType } from "react-honey-hooks";
function Example() {
  const countDown: DownCountDateType = useCountdownDate(Date.now()); // {days: 0, hours: 0, minutes: 0, seconds: 0}

  return (
    <>
      <h3> 🍯 useCountdownDate:</h3>
      <p>DownCount Date value: {JSON.stringify(countDown, null, 2)}</p>
    </>
  );
}
```

<br/>

<h3 id="use-out-side-element"> <b>🍯 useOutsideElement</b></h3>
<br/>

### JavaScript

```javascript
import { useRef } from "react";
import { useCountdownDate } from "react-honey-hooks";

function Example() {
  const refElem = useRef(null);

  useOutsideElement({
    ref: refElem,
    callback: _onClick
  });

  function _onClick() {
    // Do something
    alert("clicked outside paragraph");
  }

  return (
    <>
      <h3> 🍯 useOutsideElement:</h3>
      <p ref={refElem} onClick={_onClick}>
        click outside paragraph
      </p>
    </>
  );
}
```

### TypeScript

```typescript
import { useRef, RefObject } from "react";
import { useCountdownDate } from "react-honey-hooks";

function Example() {
  const refElem = useRef<RefObject<HTMLElement>>(null);

  useOutsideElement({
    ref: refElem,
    callback: _onClick
  });

  function _onClick() {
    // Do something
    alert("clicked outside paragraph");
  }

  return (
    <>
      <h3> 🍯 useOutsideElement:</h3>
      <p ref={refElem} onClick={_onClick}>
        click outside paragraph
      </p>
    </>
  );
}
```
