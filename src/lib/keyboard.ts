/** 입력 칸에 글을 쓰는 중이면 화면 단축키를 무시한다 */
export function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}
