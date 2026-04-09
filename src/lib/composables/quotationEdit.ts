/**
 * 报价编辑通用逻辑
 *
 * 复用场景：供应商报价编辑、客户报价编辑
 */

export function parseRouteId(paramId: string | undefined): number {
    if (!paramId) return 0;
    const parsed = parseInt(paramId, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
}

export function validateQuotationPrice(price: string | number, options?: { allowZero?: boolean }): string | null {
    const allowZero = options?.allowZero ?? false;
    const priceNum = typeof price === 'number' ? price : parseFloat(price as string);

    if (price === '' || price === null || price === undefined || Number.isNaN(priceNum)) {
        return '请输入有效的价格';
    }

    if (allowZero) {
        if (priceNum < 0) return '请输入有效的价格';
    } else if (priceNum <= 0) {
        return '请输入有效的价格';
    }

    return null;
}

export interface LoadQuotationEditDataOptions<TQuotation, TFormData, TExtraData = undefined> {
    quotationId: number;
    fetchQuotation: (id: number) => Promise<TQuotation>;
    fetchExtraData?: () => Promise<TExtraData>;
    mapToFormData: (quotation: TQuotation, extraData?: TExtraData) => TFormData;
    onSuccess: (payload: {
        quotation: TQuotation;
        formData: TFormData;
        extraData?: TExtraData;
    }) => void;
    onError: (message: string) => void;
    onLoadingChange: (loading: boolean) => void;
    invalidIdMessage?: string;
    loadFailedMessage?: string;
}

export async function loadQuotationEditData<TQuotation, TFormData, TExtraData = undefined>(
    options: LoadQuotationEditDataOptions<TQuotation, TFormData, TExtraData>
): Promise<void> {
    const {
        quotationId,
        fetchQuotation,
        fetchExtraData,
        mapToFormData,
        onSuccess,
        onError,
        onLoadingChange,
        invalidIdMessage = '无效的报价ID',
        loadFailedMessage = '加载失败',
    } = options;

    if (!quotationId) {
        onError(invalidIdMessage);
        onLoadingChange(false);
        return;
    }

    onLoadingChange(true);
    onError('');

    try {
        const [quotation, extraData] = await Promise.all([
            fetchQuotation(quotationId),
            fetchExtraData ? fetchExtraData() : Promise.resolve(undefined as TExtraData | undefined),
        ]);

        const formData = mapToFormData(quotation, extraData as TExtraData);
        onSuccess({ quotation, formData, extraData: extraData as TExtraData });
    } catch (err) {
        onError(err instanceof Error ? err.message : loadFailedMessage);
    } finally {
        onLoadingChange(false);
    }
}

export interface SubmitQuotationEditDataOptions<TFormData, TQuotation, TPayload = TFormData> {
    quotationId: number;
    formData: TFormData;
    quotation: TQuotation | null;
    update: (id: number, payload: TPayload) => Promise<unknown>;
    buildPayload?: (ctx: {
        formData: TFormData;
        quotation: TQuotation | null;
    }) => TPayload;
    validate?: (ctx: {
        quotationId: number;
        formData: TFormData;
        quotation: TQuotation | null;
    }) => string | null;
    onSubmittingChange: (submitting: boolean) => void;
    onError: (message: string) => void;
    onSuccess: (message: string) => void;
    successMessage?: string;
    updateFailedMessage?: string;
    onAfterSuccess?: () => void;
}

export async function submitQuotationEditData<TFormData, TQuotation, TPayload = TFormData>(
    options: SubmitQuotationEditDataOptions<TFormData, TQuotation, TPayload>
): Promise<void> {
    const {
        quotationId,
        formData,
        quotation,
        update,
        buildPayload,
        validate,
        onSubmittingChange,
        onError,
        onSuccess,
        successMessage = '报价更新成功',
        updateFailedMessage = '更新失败',
        onAfterSuccess,
    } = options;

    onError('');
    onSuccess('');

    if (!quotationId) {
        onError('无效的报价ID');
        return;
    }

    if (validate) {
        const validationMessage = validate({ quotationId, formData, quotation });
        if (validationMessage) {
            onError(validationMessage);
            return;
        }
    }

    onSubmittingChange(true);
    try {
        const payload = buildPayload
            ? buildPayload({ formData, quotation })
            : (formData as unknown as TPayload);
        await update(quotationId, payload);
        onSuccess(successMessage);
        onAfterSuccess?.();
    } catch (err) {
        onError(err instanceof Error ? err.message : updateFailedMessage);
    } finally {
        onSubmittingChange(false);
    }
}
