export interface UploadImage {
    bbcode: string;
    src: string;
    alt: string;
    end: number;
}
/** Read supported FoF Upload image tags without rewriting their original source. */
export declare function parseUploadImage(source: string, start?: number, max?: number): UploadImage | null;
