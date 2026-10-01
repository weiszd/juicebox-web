import { describe, it, expect, vi } from 'vitest'

vi.mock('@aidenlab/juicebox-remote', () => ({ attachRemote: vi.fn() }))
// qrcode.js reads the DOM as it loads.
vi.mock('../js/qrcode.js', () => ({ default: vi.fn() }))

import { attachRemote } from '@aidenlab/juicebox-remote'
import { createRoomWidget, joinLink } from '../js/roomWidget.js'

describe('createRoomWidget', () => {

    // A build without VITE_WS_URL must look and behave exactly as before the widget existed.
    // There is no DOM here, so a widget that rendered anything would throw.
    it('renders nothing and attaches nothing without a server url', () => {
        const mount = vi.fn()
        for (const url of [ undefined, '' ]) {
            createRoomWidget({ hic: {}, container: {}, url, mount })
        }
        expect(mount).not.toHaveBeenCalled()
        expect(attachRemote).not.toHaveBeenCalled()
    })
})

describe('joinLink', () => {

    it('is the page url carrying only the room', () => {
        expect(joinLink('https://aidenlab.org/juicebox/', 'C0FFEE1234'))
            .toBe('https://aidenlab.org/juicebox/?room=C0FFEE1234')
    })

    // Opened from a snapshot link, or from an older join link: the room supersedes both (design §7).
    it('drops a snapshot, an earlier room and the hash', () => {
        expect(joinLink('http://localhost:5173/embed.html?session=blob:abc&room=OLD#x', 'NEW0000000'))
            .toBe('http://localhost:5173/embed.html?room=NEW0000000')
    })
})
