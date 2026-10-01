import {attachRemote} from '@aidenlab/juicebox-remote'
import QRCode from './qrcode.js'
import '../css/roomWidget.css'

/**
 * The room widget: joins the room a join link (`?room=`) names, or starts one, and shows the
 * room's status and join link. A join link is not a snapshot link — the share modal makes those —
 * and the two are kept apart in code and labels. Design: juicebox-mcp
 * docs/design/ARCHITECTURE_V2.md §7–§8.
 *
 * Call after `hic.init`, so a snapshot link's session is already restored when the page joins:
 * it then seeds an empty room and yields to one with state (§7).
 *
 * @param {object} opts
 * @param {object} opts.hic         the juicebox.js namespace
 * @param {Element} opts.container  the element passed to hic.init
 * @param {string} [opts.url]       the room server's WebSocket endpoint; absent, nothing renders or attaches
 * @param {(widget: Element) => void} opts.mount  places the widget in the page
 */
function createRoomWidget({hic, container, url, mount}) {

    if (!url) {
        return
    }

    const widget = document.createElement('div')
    widget.className = 'hic-room-widget'
    widget.innerHTML =
        `<button type="button" class="hic-room-indicator"><span class="hic-room-dot"></span><span class="hic-room-status"></span></button>
        <div class="hic-room-panel" hidden>
            <button type="button" class="hic-room-start">Start room</button>
            <div class="hic-room-join" hidden>
                <div>Join link</div>
                <div class="hic-room-link"><input type="text" readonly><button type="button">Copy</button></div>
                <div class="hic-room-qr"></div>
            </div>
        </div>
        <div class="hic-room-toast" hidden></div>`
    mount(widget)

    const panel = widget.querySelector('.hic-room-panel')
    const startButton = widget.querySelector('.hic-room-start')
    const join = widget.querySelector('.hic-room-join')
    const linkInput = join.querySelector('input')
    const toast = widget.querySelector('.hic-room-toast')
    const qrcode = new QRCode(widget.querySelector('.hic-room-qr'), {width: 128, height: 128, correctLevel: QRCode.CorrectLevel.H})

    let remote
    let shownRoom
    let toastTimer

    const render = status => {
        widget.dataset.status = status
        widget.querySelector('.hic-room-status').textContent = status
        // An expired room never comes back, so the page may start another; a dropped one reconnects.
        startButton.hidden = !('standalone' === status || 'expired' === status)
        const room = remote?.room
        join.hidden = undefined === room
        if (room && room !== shownRoom) {
            shownRoom = room
            linkInput.value = joinLink(window.location.href, room)
            qrcode.makeCode(linkInput.value)
        }
    }

    const showToolCall = name => {
        toast.textContent = `Tool call: ${name}`
        toast.hidden = false
        clearTimeout(toastTimer)
        toastTimer = setTimeout(() => toast.hidden = true, 3000)
    }

    const attach = room => {
        remote = attachRemote({hic, container, url, room, onStatus: render, onToolCall: showToolCall})
    }

    widget.querySelector('.hic-room-indicator').addEventListener('click', () => panel.hidden = !panel.hidden)
    startButton.addEventListener('click', () => attach(undefined))
    join.querySelector('button').addEventListener('click', () => navigator.clipboard.writeText(linkInput.value))

    render('standalone')

    const room = new URLSearchParams(window.location.search).get('room')
    if (room) {
        attach(room)
    }
}

/**
 * The join link for `room`: this page's URL carrying only `room`. Not the remote's `joinUrl`,
 * which keeps every parameter — a snapshot link's `?session=` included, which the room supersedes
 * anyway (§7) and which would swell the QR code past what it can encode.
 */
function joinLink(href, room) {
    const url = new URL(href)
    url.search = ''
    url.hash = ''
    url.searchParams.set('room', room)
    return url.toString()
}

export {createRoomWidget, joinLink}
