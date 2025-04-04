import { Sprite, Texture } from 'pixi.js';

export class PixiSprite extends Sprite {
    constructor(texture: Texture) {
        super(texture);
    }
}