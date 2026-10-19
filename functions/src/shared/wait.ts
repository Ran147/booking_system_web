// Resolves after the given time; used to pause between attempts of a call
// that can fail for a moment.
export const wait = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
