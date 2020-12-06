import {Dimensions} from "./interfaces";
import {DimensionsHelper} from "./dimensionsHelper";

export class ProductsHandler {

    getProductVolumePerOrderedQuantity(product: Product): number {

        return this.getProductVolume(product) * product.orderedQuantity
    }

    getProductVolume(product: Product): number {

        return new DimensionsHelper().getDimensionsVolume(product.dimensions)
    }
}

export interface Product {
    id: string;
    name: string;
    orderedQuantity: number;
    dimensions: Dimensions;
    unitPrice: number;
}