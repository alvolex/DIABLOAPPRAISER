declare module 'GetWindowPosition' {
  export default function getWindowPositionByName(name: string): {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
}
