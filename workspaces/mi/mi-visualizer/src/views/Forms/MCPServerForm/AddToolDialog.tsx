/**
 * Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com) All Rights Reserved.
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React from 'react';
import styled from '@emotion/styled';

interface APIOperation {
    id: string;
    method: string;
    path: string;
    summary: string;
}

interface API {
    id: string;
    name: string;
    context: string;
    version: string;
    operations: APIOperation[];
}

interface AddToolDialogProps {
    isOpen: boolean;
    apis: API[];
    selectedAPIForTool: string;
    selectedOperationForTool: string;
    toolNameForDialog: string;
    onAPIChange: (apiId: string) => void;
    onOperationChange: (operationId: string) => void;
    onToolNameChange: (name: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
}

const DialogOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
`;

const DialogContent = styled.div`
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 8px;
    padding: 20px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

const DialogTitle = styled.h3`
    color: var(--vscode-editor-foreground);
    margin: 0 0 15px 0;
    font-size: 16px;
    font-weight: 600;
`;

const DialogField = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
`;

const DialogLabel = styled.label`
    color: var(--vscode-editor-foreground);
    font-size: 12px;
    font-weight: 500;
`;

const DialogSelect = styled.select`
    background: var(--vscode-input-background);
    color: var(--vscode-editor-foreground);
    border: 1px solid var(--vscode-input-border);
    padding: 6px 8px;
    border-radius: 3px;
    font-size: 12px;
    font-family: inherit;
    
    &:focus {
        outline: none;
        border-color: var(--vscode-focusBorder);
    }
`;

const DialogInput = styled.input`
    background: var(--vscode-input-background);
    color: var(--vscode-editor-foreground);
    border: 1px solid var(--vscode-input-border);
    padding: 6px 8px;
    border-radius: 3px;
    font-size: 12px;
    font-family: inherit;
    
    &:focus {
        outline: none;
        border-color: var(--vscode-focusBorder);
    }
`;

const DialogButtonGroup = styled.div`
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid var(--vscode-panel-border);
`;

const DialogBtn = styled.button`
    padding: 6px 12px;
    font-size: 12px;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-weight: 500;
`;

const DialogCancelBtn = styled(DialogBtn)`
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    
    &:hover {
        background: var(--vscode-button-secondaryHoverBackground);
    }
`;

const DialogAddBtn = styled(DialogBtn)`
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    
    &:hover {
        background: var(--vscode-button-hoverBackground);
    }
    
    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

export function AddToolDialog({
    isOpen,
    apis,
    selectedAPIForTool,
    selectedOperationForTool,
    toolNameForDialog,
    onAPIChange,
    onOperationChange,
    onToolNameChange,
    onConfirm,
    onCancel,
}: AddToolDialogProps) {
    if (!isOpen) return null;

    const selectedAPI = apis.find(a => a.id === selectedAPIForTool);

    return (
        <DialogOverlay onClick={onCancel}>
            <DialogContent onClick={(e) => e.stopPropagation()}>
                <DialogTitle>Add Tool</DialogTitle>

                <DialogField>
                    <DialogLabel>Select API</DialogLabel>
                    <DialogSelect
                        value={selectedAPIForTool}
                        onChange={(e) => {
                            onAPIChange(e.target.value);
                            onOperationChange('');
                        }}
                    >
                        <option value="">-- Choose an API --</option>
                        {apis.map(api => (
                            <option key={api.id} value={api.id}>
                                {api.name} ({api.context})
                            </option>
                        ))}
                    </DialogSelect>
                </DialogField>

                {selectedAPIForTool && (
                    <DialogField>
                        <DialogLabel>Select Operation</DialogLabel>
                        <DialogSelect
                            value={selectedOperationForTool}
                            onChange={(e) => onOperationChange(e.target.value)}
                        >
                            <option value="">-- Choose an operation --</option>
                            {selectedAPI?.operations.map(op => (
                                <option key={op.id} value={op.id}>
                                    {op.method} {op.path} - {op.summary}
                                </option>
                            ))}
                        </DialogSelect>
                    </DialogField>
                )}

                <DialogField>
                    <DialogLabel>Tool Name</DialogLabel>
                    <DialogInput
                        type="text"
                        value={toolNameForDialog}
                        onChange={(e) => onToolNameChange(e.target.value)}
                        placeholder="e.g., list_users"
                    />
                </DialogField>

                <DialogButtonGroup>
                    <DialogCancelBtn onClick={onCancel}>
                        Cancel
                    </DialogCancelBtn>
                    <DialogAddBtn
                        onClick={onConfirm}
                        disabled={!selectedAPIForTool || !selectedOperationForTool || !toolNameForDialog.trim()}
                    >
                        Add Tool
                    </DialogAddBtn>
                </DialogButtonGroup>
            </DialogContent>
        </DialogOverlay>
    );
}

export default AddToolDialog;