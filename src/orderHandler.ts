import {ContainerSpec, OrderRequest, ShipmentRecord} from "./interfaces";
import {ContainersHandler} from "./ContainersHandler";
import {Product, ProductsHandler} from "./ProductsHandler";

export class OrderHandler {

    private containersHandler: ContainersHandler;
    private productsHandler: ProductsHandler;

    constructor(private parameters: { containerSpecs: ContainerSpec[] }) {
        this.containersHandler = new ContainersHandler(parameters)
        this.productsHandler = new ProductsHandler()
    }

    packOrder(orderRequest: OrderRequest): ShipmentRecord {

        this.checkOrderExecutable(orderRequest)
        const containers = this.getContainers(orderRequest)

        return {
            orderId: orderRequest.id,
            totalVolume: {
                unit: "cubic centimeter",
                value: this.getTotalVolume(containers)
            },
            containers: containers
        };
    }

    getTotalVolume(containers: Containers[]) {

        let totalVolume = 0
        containers.map(container => container.containerType).forEach(containerType => {
            totalVolume += this.containersHandler.getContainerTypeVolume(containerType)
        })
        return totalVolume
    }

    private checkOrderExecutable(orderRequest: OrderRequest) {

        const containerTypesVolume = this.containersHandler.getContainerTypesVolume()
        orderRequest.products.forEach(product => {
            const productVolume = this.productsHandler.getProductVolume(product)

            let timesProductVolumeGreater = 0
            containerTypesVolume.forEach(containerTypeVolume => {
                if (productVolume > containerTypeVolume.volume) {
                    timesProductVolumeGreater += 1
                }
            })

            if (timesProductVolumeGreater === containerTypesVolume.length) {
                throw Error(`Order can't be executed, since one of it's product(s) (${product.id}) volume exceeds available containers volume.`)
            }
        })
    }

    // same container could be used multiple times
    private getContainers(orderRequest: OrderRequest): Containers[] {

        let containers: Containers[] = []
        const availableContainers = this.containersHandler.getContainers()

        orderRequest.products.forEach(product => {
            let quantityAdded = 0

            for (let i = 0; i < availableContainers.length; i++) {
                const containerSpec = availableContainers[i]
                let containingProducts: ContainingProduct[] = []

                if (this.canStoreProduct(containerSpec, product)) {
                    if (this.canStoreProductPerOrderedQuantity(containerSpec, product)) {
                        containers.push({
                            containerType: containerSpec.containerType,
                            containingProducts: this.addToContainingProducts(containingProducts, product.id, product.orderedQuantity)
                        })
                        quantityAdded += product.orderedQuantity
                        break // no need to check in next container
                    } else {
                        const howManyCanBeStored = this.howManyCanBeStored(containerSpec, product)
                        containers.push({
                            containerType: containerSpec.containerType,
                            containingProducts: this.addToContainingProducts(containingProducts, product.id, howManyCanBeStored)
                        })
                        quantityAdded += howManyCanBeStored
                    }
                }
            }

            const diff = product.orderedQuantity - quantityAdded
            if (diff > 0) {
                containers = this.reuseSameContainer(diff, containers)
            }
        })

        return containers
    }

    private reuseSameContainer(howManyTimes: number, containers: Containers[]): Containers[] {

        const container = containers[0]
        for (let i = 0; i < howManyTimes; i++) {
            containers.push(container)
        }
        return containers
    }

    private canStoreProductPerOrderedQuantity(containerSpec: ContainerSpec, product: Product): boolean {

        return this.containersHandler.getContainerVolume(containerSpec) >= this.productsHandler.getProductVolumePerOrderedQuantity(product)
    }

    private canStoreProduct(containerSpec: ContainerSpec, product: Product): boolean {

        return this.containersHandler.getContainerVolume(containerSpec) >= this.productsHandler.getProductVolume(product)
    }

    private howManyCanBeStored(containerSpec: ContainerSpec, product: Product): number {

        const containerVolume = this.containersHandler.getContainerVolume(containerSpec)
        const productVolume = this.productsHandler.getProductVolume(product)
        let adjustableVolume = productVolume

        let quantity = 0
        while (adjustableVolume <= containerVolume) {
            adjustableVolume += productVolume
            quantity += 1
        }

        return quantity
    }

    private addToContainingProducts(containingProducts: ContainingProduct[], id: string, quantity: number): ContainingProduct[] {

        containingProducts.push({
            id: id,
            quantity: quantity
        })

        return containingProducts
    }
}


interface Containers {
    containerType: string;
    containingProducts: ContainingProduct[]
}

interface ContainingProduct {
    id: string;
    quantity: number
}