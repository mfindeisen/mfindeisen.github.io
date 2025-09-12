/**
 * MouseController - Handles mouse interactions and controls
 */
export class MouseController {
    constructor(THREE) {
        this.THREE = THREE;
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseDown = false;
        this.worldRotationY = 0;
        this.targetWorldRotationY = 0;
        this.rotationSpeed = 0.1;
        
        this.setupEventListeners();
    }

    /**
     * Setup mouse event listeners
     */
    setupEventListeners() {
        // Mouse rotation disabled - no event listeners needed
        // window.addEventListener('mousedown', this.onMouseDown.bind(this));
        // window.addEventListener('mousemove', this.onMouseMove.bind(this));
        // window.addEventListener('mouseup', this.onMouseUp.bind(this));
        // window.addEventListener('mouseleave', this.onMouseUp.bind(this));
    }

    /**
     * Handle mouse down event
     */
    onMouseDown(e) {
        this.isMouseDown = true;
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
    }

    /**
     * Handle mouse move event
     */
    onMouseMove(e) {
        if (!this.isMouseDown) return;
        
        const deltaX = e.clientX - this.mouseX;
        
        // Only rotate around Y-axis (Earth's natural rotation axis)
        this.targetWorldRotationY += deltaX * 0.01;
        
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
    }

    /**
     * Handle mouse up event
     */
    onMouseUp() {
        this.isMouseDown = false;
    }

    /**
     * Update rotation interpolation
     */
    update() {
        this.worldRotationY += (this.targetWorldRotationY - this.worldRotationY) * this.rotationSpeed;
    }

    /**
     * Get current world rotation
     */
    getWorldRotation() {
        return this.worldRotationY;
    }

    /**
     * Get target world rotation
     */
    getTargetWorldRotation() {
        return this.targetWorldRotationY;
    }

    /**
     * Set target world rotation
     */
    setTargetWorldRotation(rotation) {
        this.targetWorldRotationY = rotation;
    }

    /**
     * Reset rotation
     */
    resetRotation() {
        this.worldRotationY = 0;
        this.targetWorldRotationY = 0;
    }

    /**
     * Check if mouse is down
     */
    isMousePressed() {
        return this.isMouseDown;
    }

    /**
     * Get mouse position
     */
    getMousePosition() {
        return {
            x: this.mouseX,
            y: this.mouseY
        };
    }

    /**
     * Destroy mouse controller
     */
    destroy() {
        window.removeEventListener('mousedown', this.onMouseDown.bind(this));
        window.removeEventListener('mousemove', this.onMouseMove.bind(this));
        window.removeEventListener('mouseup', this.onMouseUp.bind(this));
        window.removeEventListener('mouseleave', this.onMouseUp.bind(this));
    }
}
