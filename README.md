Here's what a **Vanilla Graphics flavoured Markdown** file looks like.

````md
```include
js:
  - ./myScript.js
  - https://example.com/script.js
css:
  - ./myStyle.css
  - https://example.com/style.css
```

```keydefs
scene-one:
  square-x:
    type: number
    smooth: linear
  square-y:
    type: number
    smooth: polynomial
  square-color:
    type: string
    smooth: nearest
```

# This Article is Very Important, Here's Why

This is a square, the square is currently in the middle of your screen, and it is blue.

```key
scene-one:
  square-x: 0
  square-y: 0
  square-color: blue
```

However, if you scroll down to here, the square becomes red and moves left.

```key
scene-one:
  square-x: -1
  square-color: red
```

## Top 0 Reasons why Constantiam is a Pretty Cool Minecraft Server

Thanks for watching, don't forget to like and subscript for more content.

```inline-js
console.log("Hello world!");
```

```inline-css
body {
  background: red;
}
```
````
