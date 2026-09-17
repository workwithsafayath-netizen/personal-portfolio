/**
 * Type shim so TypeScript consumers (src/main.tsx) can import the
 * hand-written App.jsx without converting it to TSX.
 */
declare const App: () => import("react").ReactElement;
export default App;
export declare const expoOut: (t: number) => number;
