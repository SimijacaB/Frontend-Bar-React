import { useState } from 'react'
import type { FC } from 'react'
import './header.css'
import beerIcon from '../../assets/icons/Beer Icon 48.png'

const Header: FC = () => {
    const [open, setOpen] = useState(false)

    return (
        <header className="site-header">
            <div className="container header-inner">
                <div className="brand">
                    <div className="logo-circle">
                        <img src={beerIcon} alt="Project Bar" width="24" height="24" />
                    </div>
                    <div className="brand-text">
                        <strong>Project Bar</strong>
                        <small>Bar & Cocktails</small>
                    </div>
                </div>

                <nav className={`nav ${open ? 'open' : ''}`} aria-hidden={!open}>
                    <a href="#menu">Menú</a>
                    <a href="#orders">Pedir</a>
                    <a href="#about">Sobre</a>
                </nav>

                <div className="actions">
                    <button className="btn primary">Reservar</button>
                    <button className="hamburger" aria-label="Abrir menú" onClick={() => setOpen(v => !v)}>
                        <span className="bar" />
                        <span className="bar" />
                        <span className="bar" />
                    </button>
                </div>
            </div>
        </header>
    )
}

export default Header
