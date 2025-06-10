export interface Inventory {
    id: string;
    name: string;
    description?: string;
    serialNumber?: string;
    quantity: number;
    unitPrice: number;
    category: string;
    location?: string;
    minimumStock: number;
    isActive: boolean;
    isReturnItem: boolean;
    returnCause?: 'faulty' | 'removed' | 'surplus';
    arStatus: string;
    mrnStatus: string;
    isReturnedToWarehouse: boolean;
    jobId?: string;
    createdAt: string;
    updatedAt: string;
} 