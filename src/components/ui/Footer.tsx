import type { FC } from 'react'
import './footer.css'

const Footer: FC = () => {
    return (
        <footer className="site-footer">
            <div className="container footer-inner">
                <div>
                    <strong>Project Bar</strong> — Buenos cócteles, buena música.
                </div>
                <div className="socials">
                    <a href="#">Instagram</a>
                    <a href="#">Facebook</a>
                </div>
            </div>
        </footer>
    )
}

export default Footer
