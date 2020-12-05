import {ContainerSpec} from "./interfaces";
import {DimensionsHelper} from "./DimensionsHelper";

export class ContainersHandler {

    constructor(private parameters: { containerSpecs: ContainerSpec[] }) {
    }

    getContainers(): ContainerSpec[] {
        return this.parameters.containerSpecs
    }

    getContainerTypeVolume(containerType: string): number {
        const containerSpec = this.getContainers().filter(containerSpec => containerSpec.containerType === containerType)[0]
        return this.getContainerVolume(containerSpec)
    }

    getContainerVolume(containerSpecs: ContainerSpec): number {
        return new DimensionsHelper().getDimensionsVolume(containerSpecs.dimensions)
    }

    getContainerTypesVolume(): ContainerTypeVolume[] {
        return this.parameters.containerSpecs.map(containerSpecs => {
                return {
                    containerType: containerSpecs.containerType,
                    volume: this.getContainerVolume(containerSpecs)
                }
            }
        )
    }
}


export interface ContainerTypeVolume {
    containerType: string
    volume: number
}