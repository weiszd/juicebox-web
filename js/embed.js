import hic from 'juicebox.js'
import {registerDevUrlMapper} from './devUrlMapper.js'
import {createRoomWidget} from './roomWidget.js'
import 'juicebox.js/dist/css/juicebox.css'

document.addEventListener('DOMContentLoaded', async () => {
    // Ahead of hic.init, so the mapper is in place before any map or track read.
    await registerDevUrlMapper()
    const container = document.getElementById('app-container')
    await hic.init(container, {})
    createRoomWidget({
        hic,
        container,
        url: import.meta.env.VITE_WS_URL,
        mount: widget => {
            widget.classList.add('hic-room-widget--floating')
            document.body.appendChild(widget)
        }
    })
})
