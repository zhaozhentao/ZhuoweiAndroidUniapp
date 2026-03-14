/**
 * 延迟执行
 * @param {number} time - 延迟时间（毫秒）
 * @returns {Promise<void>}
 */
export async function sleep(time) {
  return new Promise(resolve => setTimeout(resolve, time))
}
