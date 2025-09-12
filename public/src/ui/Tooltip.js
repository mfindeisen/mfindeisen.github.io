/**
 * Tooltip - Handles temporary tooltip messages and notifications
 */
export class Tooltip {
    constructor() {
        this.activeTooltips = new Set();
    }

    /**
     * Show a tooltip message
     */
    show(message, duration = 2000, position = 'center') {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = message;
        
        // Position the tooltip
        this.setTooltipPosition(tooltip, position);
        
        document.body.appendChild(tooltip);
        this.activeTooltips.add(tooltip);
        
        // Auto-remove after duration
        setTimeout(() => {
            this.remove(tooltip);
        }, duration);
        
        return tooltip;
    }

    /**
     * Set tooltip position
     */
    setTooltipPosition(tooltip, position) {
        const positions = {
            'center': {
                top: '50px',
                left: '50%',
                transform: 'translateX(-50%)'
            },
            'top-left': {
                top: '20px',
                left: '20px',
                transform: 'none'
            },
            'top-right': {
                top: '20px',
                right: '20px',
                left: 'auto',
                transform: 'none'
            },
            'bottom-center': {
                bottom: '20px',
                left: '50%',
                top: 'auto',
                transform: 'translateX(-50%)'
            }
        };
        
        const pos = positions[position] || positions['center'];
        Object.assign(tooltip.style, pos);
    }

    /**
     * Remove a specific tooltip
     */
    remove(tooltip) {
        if (tooltip && tooltip.parentNode) {
            tooltip.remove();
            this.activeTooltips.delete(tooltip);
        }
    }

    /**
     * Remove all active tooltips
     */
    removeAll() {
        this.activeTooltips.forEach(tooltip => {
            if (tooltip && tooltip.parentNode) {
                tooltip.remove();
            }
        });
        this.activeTooltips.clear();
    }

    /**
     * Show success message
     */
    success(message, duration = 2000) {
        const tooltip = this.show(message, duration);
        tooltip.style.background = 'rgba(34, 197, 94, 0.9)';
        tooltip.style.border = '1px solid rgba(34, 197, 94, 1)';
        return tooltip;
    }

    /**
     * Show error message
     */
    error(message, duration = 3000) {
        const tooltip = this.show(message, duration);
        tooltip.style.background = 'rgba(239, 68, 68, 0.9)';
        tooltip.style.border = '1px solid rgba(239, 68, 68, 1)';
        return tooltip;
    }

    /**
     * Show warning message
     */
    warning(message, duration = 2500) {
        const tooltip = this.show(message, duration);
        tooltip.style.background = 'rgba(245, 158, 11, 0.9)';
        tooltip.style.border = '1px solid rgba(245, 158, 11, 1)';
        return tooltip;
    }

    /**
     * Show info message
     */
    info(message, duration = 2000) {
        const tooltip = this.show(message, duration);
        tooltip.style.background = 'rgba(59, 130, 246, 0.9)';
        tooltip.style.border = '1px solid rgba(59, 130, 246, 1)';
        return tooltip;
    }

    /**
     * Add tooltip styles to the document
     */
    static addStyles() {
        if (document.querySelector('#tooltip-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'tooltip-styles';
        style.textContent = `
            .tooltip {
                position: fixed;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 10px 20px;
                border-radius: 20px;
                font-size: 16px;
                z-index: 1001;
                animation: fadeInOut 3s ease forwards;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                max-width: 300px;
                text-align: center;
                word-wrap: break-word;
            }
            
            @keyframes fadeInOut {
                0% { 
                    opacity: 0; 
                    transform: translateX(-50%) translateY(-20px); 
                }
                20% { 
                    opacity: 1; 
                    transform: translateX(-50%) translateY(0); 
                }
                80% { 
                    opacity: 1; 
                    transform: translateX(-50%) translateY(0); 
                }
                100% { 
                    opacity: 0; 
                    transform: translateX(-50%) translateY(-20px); 
                }
            }
            
            .tooltip[style*="transform: none"] {
                animation: fadeInOutNoTransform 3s ease forwards;
            }
            
            @keyframes fadeInOutNoTransform {
                0% { 
                    opacity: 0; 
                    transform: translateY(-20px); 
                }
                20% { 
                    opacity: 1; 
                    transform: translateY(0); 
                }
                80% { 
                    opacity: 1; 
                    transform: translateY(0); 
                }
                100% { 
                    opacity: 0; 
                    transform: translateY(-20px); 
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Initialize tooltip system
     */
    static init() {
        Tooltip.addStyles();
    }
}
