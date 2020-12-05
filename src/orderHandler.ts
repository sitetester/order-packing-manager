import {ContainerSpec, OrderRequest, ShipmentRecord} from "./interfaces";
import {ContainersHandler} from "./ContainersHandler";
import {Product, ProductsHandler} from "./ProductsHandler";
import * as util from "util";

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
                // value: 0 // this should be dimensions of all USED containers (along with their quantity)
                value: this.getTotalVolume(containers)
            },
            containers: containers
        };
    }

    debug(obj: Object) {
        console.log(util.inspect(obj, {showHidden: false, depth: null}))
    }

    getTotalVolume(containers: Containers[]) {
        let totalVolume = 0
        containers.map(container => container.containerType).forEach(containerType => {
            totalVolume += this.containersHandler.getContainerTypeVolume(containerType)
        })
        return totalVolume
    }

    // ignore that container whose total volume is less than required ProductVolumePerOrderedQuantity
    private checkOrderExecutable(orderRequest: OrderRequest) {
        const exceedingSizeProducts: string[] = []
        const containerTypesVolume = this.containersHandler.getContainerTypesVolume()
        containerTypesVolume.forEach(containerTypeVolume => {
            orderRequest.products.forEach(product => {
                const productVolume = this.productsHandler.getProductVolume(product)
                if (productVolume > containerTypeVolume.volume) {
                    if (!exceedingSizeProducts.includes(product.id)) {
                        exceedingSizeProducts.push(product.id)
                    }
                }
            })
        })

        if (exceedingSizeProducts.length > 0) {
            let error = `Order can't be executed, since one of it's product(s) (${JSON.stringify(exceedingSizeProducts)}`
            error += ` exceeds available containers volume.`

            this.debug(error)
            throw Error(error)
        }
    }

    // same container could be used multiple times
    private getContainers(orderRequest: OrderRequest): Containers[] {

        let containers: Containers[] = []
        const availableContainers = this.containersHandler.getContainers()

        orderRequest.products.forEach(product => {

            for (let i = 0; i < availableContainers.length; i++) {
                const containerSpec = availableContainers[i]
                let containingProducts: ContainingProduct[] = []

                // this.debug("containerSpec ---- " + containerSpec.containerType)

                if (this.canStoreProduct(containerSpec, product)) {
                    if (this.canStoreProductPerOrderedQuantity(containerSpec, product)) {
                        containers.push({
                            containerType: containerSpec.containerType,
                            containingProducts: this.addToContainingProducts(containingProducts, product.id, product.orderedQuantity)
                        })
                        break // no need to check in next container
                    } else {
                        const howManyCanBeStored = this.howManyCanBeStored(containerSpec, product)
                        // this.debug('howManyCanBeStored = ' + howManyCanBeStored)
                        containers.push({
                            containerType: containerSpec.containerType,
                            containingProducts: this.addToContainingProducts(containingProducts, product.id, howManyCanBeStored)
                        })
                    }
                }
            }
        })

        // this.debug(containers)
        return containers
    }

    private canStoreProductPerOrderedQuantity(containerSpec: ContainerSpec, product: Product): boolean {
        return this.productsHandler.getProductVolumePerOrderedQuantity(product) <= this.containersHandler.getContainerVolume(containerSpec)
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