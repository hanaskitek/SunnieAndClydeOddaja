export class Primitive {

    constructor({
        mesh,
        material,
    } = {}) {
        this.mesh = mesh;
        this.material = material;
    }

    // SPREMEMBA
    addMaterial(material) {
        this.material = material;
    }

}
