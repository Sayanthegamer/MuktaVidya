## 2024-06-03 - Initial Journal
**Learning:** Just starting out as Bolt, looking for performance opportunities.
**Action:** Profile the frontend and backend.
## 2024-06-03 - DiagramRenderer Optimization
**Learning:** Found a heavy re-calculation inside `DiagramRenderer` where regular expressions and DOM manipulation string replacements are run synchronously during render for every diagram.
**Action:** The logic is currently wrapped in `useMemo`, but it could be optimized further if there's any unnecessary string allocations or missing memoization, or perhaps there are other easy performance wins like adding `React.memo` to `DiagramRenderer`.
## 2024-06-03 - SolutionPanel Optimization
**Learning:** `SolutionPanel` renders `ReactMarkdown` directly which is very heavy, especially when `isStreaming` is true, meaning it re-renders on every streamed chunk. But `ReactMarkdown` is only wrapped around the final, non-streaming text according to line 195: `{!isCurrentlyStreaming ? ... : <pre>...streaming...</pre>}`. Wait, if `isCurrentlyStreaming` is true, it renders a `<pre>` tag, so it doesn't run Markdown rendering. That's a good optimization already.
**Action:** Let's look for other optimizations. What about `DiagramRenderer` being memoized? It is wrapped in `useMemo` inside, but the component itself is not memoized with `React.memo`. This means it will re-render if `SolutionPanel` re-renders, although its internal calculations are memoized. But `SolutionPanel` only re-renders when `messages` changes, which happens on stream chunks. Wait, if `SolutionPanel` re-renders on every stream chunk, ALL previous messages are also re-rendered, including their `ReactMarkdown`! That's a huge performance issue!
## 2024-06-03 - Memoize Message Item
**Learning:** React re-renders the ENTIRE `SolutionPanel` whenever `messages` updates. In streaming mode, this happens for every single chunk (multiple times per second). While the current streaming message renders as a fast `<pre>` block, all PREVIOUS completed messages in the array are re-rendered too, executing `ReactMarkdown`, `remarkMath`, `rehypeKatex`, and `DiagramRenderer` synchronously on the main thread for every chunk! This can cause severe UI stuttering and frame drops during streaming, especially with multiple messages in the history.
**Action:** Extract the message rendering logic into a `React.memo` component (e.g. `ChatMessageItem`). Since previous messages' text doesn't change during the streaming of a new message, `React.memo` will prevent them from re-rendering on every chunk, drastically improving performance.

## 2024-06-03 - Memoize Message Item Properties

**Learning:** We had a component `ChatMessageItem` wrapped in `React.memo` inside a `map` loop. However, inline functions passed as props (`onCopy={() => handleCopy(index, ...)}`) broke memoization, causing all instances in the array to re-render synchronously whenever any parent state changed (like incoming stream chunks).
**Action:** Always verify that components wrapped in `React.memo` receive referentially stable props. When passing callback functions to iterated elements, redefine the child's prop signature to accept the iteration variables (e.g., `index`, `data`), allowing you to pass down a single memoized parent callback function directly.
## 2024-06-03 - React.memo Pitfalls
**Learning:** React state updater callbacks execute asynchronously during the render phase when batched in event handlers. Mutating local variables directly inside the updater logic and reading them immediately afterwards will always yield the initial value, resulting in functional regressions like broken API locks.
**Action:** When removing dependencies from useCallback, either embrace the dependencies if they rarely change (e.g., occasional UI feedback interactions won't impact streaming render limits), or use useRef to guarantee synchronous access to the latest state within the same event loop.
