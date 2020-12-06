import {Dimensions} from "./interfaces";

export class DimensionsHelper {

    getDimensionsVolume(dimensions: Dimensions): number {
        return (dimensions.length * dimensions.width * dimensions.height)
    }
}