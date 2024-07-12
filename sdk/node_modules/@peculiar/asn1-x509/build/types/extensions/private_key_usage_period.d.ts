/**
 * ```
 * id-ce-privateKeyUsagePeriod OBJECT IDENTIFIER ::=  { id-ce 16 }
 * ```
 */
export declare const id_ce_privateKeyUsagePeriod = "2.5.29.16";
/**
 * ```
 * PrivateKeyUsagePeriod ::= SEQUENCE {
 *     notBefore       [0]     GeneralizedTime OPTIONAL,
 *     notAfter        [1]     GeneralizedTime OPTIONAL }
 * ```
 */
export declare class PrivateKeyUsagePeriod {
    notBefore?: Date;
    notAfter?: Date;
    constructor(params?: Partial<PrivateKeyUsagePeriod>);
}
