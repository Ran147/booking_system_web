export type TransitionMap<Status extends string> = Readonly<
  Record<Status, readonly Status[]>
>;

export const canTransition = <Status extends string>(
  transitionMap: TransitionMap<Status>,
  currentStatus: Status,
  nextStatus: Status,
): boolean => transitionMap[currentStatus].includes(nextStatus);
