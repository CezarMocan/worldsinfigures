export const eventOnLeftBorder = (evt, el, thresh) => {
    const br = el.getBoundingClientRect()
    const { clientX, clientY } = evt
    return (Math.abs(clientX - br.left) < thresh)
}
export const eventOnRightBorder = (evt, el, thresh) => {
    const br = el.getBoundingClientRect()
    const { clientX, clientY } = evt
    return (Math.abs(clientX - br.right) < thresh)
}
export const eventOnLeftRightBorder = (evt, el, thresh) => {
    return (eventOnLeftBorder(evt, el, thresh) || eventOnRightBorder(evt, el, thresh))
}
export const eventOnTopBorder = (evt, el, thresh) => {
    const br = el.getBoundingClientRect()
    const { clientX, clientY } = evt
    return (Math.abs(clientY - br.top) < thresh)
}
export const eventOnBottomBorder = (evt, el, thresh) => {
    const br = el.getBoundingClientRect()
    const { clientX, clientY } = evt
    return (Math.abs(clientY - br.bottom) < thresh)
}
export const eventOnTopBottomBorder = (evt, el, thresh) => {
    return (eventOnTopBorder(evt, el, thresh) || eventOnBottomBorder(evt, el, thresh))
}
