/** 수신함 안에서 다른 대화로 가는 주소. from이 있으면 대화창 위에 돌아가기 버튼이 나온다 */
export function threadHref(threadId: string, from?: string) {
  return from ? `/inbox?thread=${threadId}&from=${from}` : `/inbox?thread=${threadId}`;
}

/**
 * 목록에서 대화를 고를 때는 주소가 바뀌지 않는다.
 * 다른 대화로 가기 전에 지금 대화를 주소에 남겨 두면 브라우저 뒤로 가기로 돌아올 수 있다.
 */
export function keepThreadInHistory(threadId: string) {
  window.history.replaceState(null, "", threadHref(threadId));
}
