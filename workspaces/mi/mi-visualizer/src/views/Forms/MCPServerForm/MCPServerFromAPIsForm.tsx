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

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { TextField, Button } from '@wso2/ui-toolkit';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useVisualizerContext } from '@wso2/mi-rpc-client';
import { EVENT_TYPE, MACHINE_VIEW } from '@wso2/mi-core';
import { View, ViewContent, ViewHeader } from '../../../components/View';
import AddToolDialog from './AddToolDialog';
import * as pathModule from 'path';
import * as yaml from 'yaml';

// ─── Types ───────────────────────────────────────────────────────────────────

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
    rawVersion: string;
    xmlPath: string;
    operations: APIOperation[];
}

interface Sequence {
    id: string;
    name: string;
    xmlPath: string;
}

interface APITool {
    kind: 'api';
    id: string;
    name: string;
    description: string;
    apiId: string;
    apiName: string;
    apiVersion: string;
    apiRawVersion: string;
    apiXmlPath: string;
    operationId: string;
    operationMethod: string;
    operationPath: string;
    operationSummary: string;
    inputSchema?: string;
}

interface SequenceTool {
    kind: 'sequence';
    id: string;
    name: string;
    description: string;
    sequenceName: string;
    sequenceXmlPath: string;
    inputSchema: string;
}

type UnifiedTool = APITool | SequenceTool;

// ─── Styled Components ────────────────────────────────────────────────────────

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    flex: 1;
    max-width: 900px;
`;

const Title = styled.h2`
    color: var(--vscode-editor-foreground);
    margin: 0 0 10px 0;
    font-size: 20px;
    font-weight: 600;
`;

const Description = styled.p`
    color: var(--vscode-descriptionForeground);
    margin: 0 0 20px 0;
    font-size: 13px;
`;

const FormSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 15px;
`;

const SectionLabel = styled.label`
    color: var(--vscode-editor-foreground);
    font-weight: 500;
    font-size: 14px;
    display: block;
`;

const ToolsSectionHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const ToolInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
`;

const ToolName = styled.span`
    font-weight: 600;
    font-size: 12px;
    color: var(--vscode-editor-foreground);
`;

const ToolDescription = styled.span`
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
`;

const MethodBadge = styled.span<{ method: string }>`
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 600;
    background: ${(props: any) => {
        const m = props.method?.toUpperCase() || '';
        const colors: any = { GET: '#61affe', POST: '#49cc90', PUT: '#fca130', DELETE: '#f93e3e', PATCH: '#50e3c2' };
        return colors[m] || '#999';
    }};
    color: white;
    min-width: 45px;
    text-align: center;
`;

const SeqBadge = styled.span`
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 600;
    background: #7c4dff;
    color: white;
    min-width: 60px;
    text-align: center;
`;

const ToolsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 10px;
`;

const ToolItem = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 3px;
`;

const ToolMeta = styled.span`
    color: var(--vscode-descriptionForeground);
    font-size: 11px;
    font-family: monospace;
`;

const RemoveBtn = styled.button`
    padding: 4px 8px;
    font-size: 11px;
    background: var(--vscode-errorForeground);
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    &:hover { opacity: 0.8; }
`;

const EmptyMessage = styled.div`
    color: var(--vscode-descriptionForeground);
    text-align: center;
    padding: 15px;
    font-size: 12px;
`;

const ErrorMessage = styled.div`
    color: var(--vscode-inputValidation-errorBorder);
    padding: 10px;
    border: 1px solid var(--vscode-inputValidation-errorBorder);
    border-radius: 4px;
    background: var(--vscode-inputValidation-errorBackground);
    font-size: 12px;
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 20px;
`;

const AddToolBtn = styled.button`
    padding: 8px 16px;
    font-size: 13px;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-weight: 500;
    &:hover { background: var(--vscode-button-hoverBackground); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

// ─── Sequence Tool Dialog ─────────────────────────────────────────────────────

const DialogOverlay = styled.div`
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
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
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
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
    gap: 8px;
    margin-bottom: 15px;
`;

const DialogLabel = styled.label`
    color: var(--vscode-editor-foreground);
    font-size: 12px;
    font-weight: 500;
`;

const SequencesList = styled.div`
    background: var(--vscode-input-background);
    border: 1px solid var(--vscode-input-border);
    border-radius: 3px;
    max-height: 400px;
    overflow-y: auto;
    padding: 8px 0;
`;

const SequenceItem = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--vscode-panel-border);
    &:last-child { border-bottom: none; }
    &:hover { background: var(--vscode-list-hoverBackground); }
`;

const SequenceItemHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
`;

const SequenceCheckbox = styled.input`
    cursor: pointer;
    accent-color: var(--vscode-focusBorder);
    margin-top: 2px;
`;

const SequenceName = styled.span`
    color: var(--vscode-editor-foreground);
    font-family: monospace;
    font-size: 12px;
`;

const SelectAllRow = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--vscode-panel-border);
    background: var(--vscode-list-activeSelectionBackground);
`;

const SelectAllLabel = styled.label`
    cursor: pointer;
    margin-bottom: 0;
    font-size: 12px;
    color: var(--vscode-editor-foreground);
`;

const CustomInputsContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-left: 26px;
`;

const InputFieldLabel = styled.label`
    font-size: 10px;
    color: var(--vscode-descriptionForeground);
    margin-top: 2px;
`;

const CustomInput = styled.input`
    background: var(--vscode-editor-background);
    color: var(--vscode-editor-foreground);
    border: 1px solid var(--vscode-input-border);
    padding: 4px 6px;
    border-radius: 3px;
    font-size: 11px;
    font-family: inherit;
    &:focus { outline: none; border-color: var(--vscode-focusBorder); }
`;

const SchemaRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

const SchemaTextarea = styled.textarea`
    width: 100%;
    min-height: 80px;
    padding: 6px 8px;
    font-size: 12px;
    font-family: var(--vscode-editor-font-family, monospace);
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border, var(--vscode-panel-border));
    border-radius: 3px;
    resize: vertical;
    box-sizing: border-box;
    &:focus { outline: none; border-color: var(--vscode-focusBorder); }
`;

const SchemaImportBtn = styled.button`
    padding: 4px 10px;
    font-size: 12px;
    white-space: nowrap;
    border: 1px solid var(--vscode-button-secondaryBackground);
    border-radius: 3px;
    cursor: pointer;
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    &:hover { background: var(--vscode-button-secondaryHoverBackground); }
`;

const SchemaError = styled.span`
    color: var(--vscode-inputValidation-errorForeground, var(--vscode-errorForeground));
    font-size: 11px;
`;

const InfoPanel = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px 16px;
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 6px;
    margin-bottom: 8px;
`;

const InfoRow = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`;

const InfoLabel = styled.span`
    color: var(--vscode-descriptionForeground);
    font-size: 13px;
    font-weight: 500;
    min-width: 80px;
`;

const InfoValue = styled.span`
    color: var(--vscode-editor-foreground);
    font-size: 13px;
    font-weight: 600;
    font-family: var(--vscode-editor-font-family, monospace);
`;

// ─── Tool Type Selection Page ─────────────────────────────────────────────────

const ToolTypePage = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 24px;
    width: 100%;
    text-align: center;
`;

const ToolTypePageCard = styled.div`
    flex: 1;
    padding: 32px 24px;
    border: 2px solid var(--vscode-panel-border);
    border-radius: 10px;
    cursor: pointer;
    text-align: center;
    transition: border-color 0.15s ease, background 0.15s ease, transform 0.1s ease;
    &:hover {
        border-color: var(--vscode-focusBorder);
        background: var(--vscode-list-hoverBackground);
        transform: translateY(-2px);
    }
`;

const ToolTypePageCardTitle = styled.div`
    font-weight: 600;
    font-size: 16px;
    color: var(--vscode-editor-foreground);
    margin-bottom: 8px;
`;

const ToolTypePageCardDesc = styled.div`
    font-size: 13px;
    color: var(--vscode-descriptionForeground);
    line-height: 1.5;
`;

const ToolTypePageCards = styled.div`
    display: flex;
    gap: 20px;
`;

const BackBtn = styled.button`
    align-self: flex-start;
    padding: 6px 14px;
    font-size: 13px;
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-weight: 500;
    &:hover { background: var(--vscode-button-secondaryHoverBackground); }
`;

const DialogButtonGroup = styled.div`
    display: flex;
    gap: 10px;
    justify-content: space-between;
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid var(--vscode-panel-border);
`;

const SelectionInfo = styled.span`
    color: var(--vscode-descriptionForeground);
    font-size: 12px;
    align-self: center;
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
    &:hover { background: var(--vscode-button-secondaryHoverBackground); }
`;

const DialogAddBtn = styled(DialogBtn)`
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    &:hover { background: var(--vscode-button-hoverBackground); }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cleanPathForToolName(path: string): string {
    return path
        .replace(/[{}]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_+|_+$/g, '');
}

function convertToJsonSchema(input: string): string | null {
    if (!input.trim()) return null;
    try {
        const sanitized = input.replace(/:\s*(string|number|integer|boolean|array|object|null)\b/g, ': "$1"');
        const parsed = JSON.parse(sanitized);
        if (parsed.type || parsed.properties) return JSON.stringify(parsed);
        const properties: Record<string, { type: string }> = {};
        for (const [k, v] of Object.entries(parsed)) properties[k] = { type: v as string };
        return JSON.stringify({ type: 'object', properties, additionalProperties: false });
    } catch {
        return null;
    }
}

function extractInputSchema(spec: any, method: string, operationPath: string): object {
    const pathItem = spec?.paths?.[operationPath];
    if (!pathItem) return { type: 'object', properties: {}, additionalProperties: false };
    const operation = pathItem[method.toLowerCase()];
    if (!operation) return { type: 'object', properties: {}, additionalProperties: false };

    const properties: Record<string, any> = {};
    const required: string[] = [];

    if (Array.isArray(operation.parameters)) {
        for (const param of operation.parameters) {
            if ((param.in === 'path' || param.in === 'query') && param.name && param.schema) {
                properties[param.name] = { ...param.schema, ...(param.description ? { description: param.description } : {}) };
                if (param.required) required.push(param.name);
            }
        }
    }

    const bodySchema = operation.requestBody?.content?.['application/json']?.schema;
    if (bodySchema?.properties) {
        for (const [key, value] of Object.entries(bodySchema.properties)) {
            properties[key] = value;
        }
        if (Array.isArray(bodySchema.required)) required.push(...bodySchema.required);
    }

    const schema: any = { type: 'object', properties, additionalProperties: false };
    if (required.length > 0) schema.required = required;
    return schema;
}

function parseToolsFromXML(xmlContent: string): UnifiedTool[] {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlContent, 'text/xml');
        const toolElements = Array.from(doc.querySelectorAll('tool'));

        return toolElements.map(toolEl => {
            const name = toolEl.getAttribute('name') || '';
            const description = toolEl.querySelector('description')?.textContent?.trim() || '';
            const seqEl = toolEl.querySelector('sequence');
            const apiEl = toolEl.querySelector('api');

            if (seqEl) {
                return {
                    kind: 'sequence' as const,
                    id: crypto.randomUUID(),
                    name,
                    description,
                    sequenceName: seqEl.textContent?.trim() || '',
                    sequenceXmlPath: '',
                    inputSchema: toolEl.querySelector('inputSchema')?.textContent?.trim()
                        || '{"type":"object","properties":{},"additionalProperties":false}',
                };
            } else {
                const method = toolEl.querySelector('method')?.textContent?.trim() || '';
                const resource = toolEl.querySelector('resource')?.textContent?.trim() || '';
                const apiName = apiEl?.textContent?.trim() || '';
                const existingSchema = toolEl.querySelector('inputSchema')?.textContent?.trim();
                return {
                    kind: 'api' as const,
                    id: crypto.randomUUID(),
                    name,
                    description,
                    apiId: apiName,
                    apiName,
                    apiVersion: '1.0.0',
                    apiRawVersion: '',
                    apiXmlPath: '',
                    operationId: `${method}_${resource}`.replace(/[^a-zA-Z0-9_]/g, '_'),
                    operationMethod: method,
                    operationPath: resource,
                    operationSummary: description,
                    inputSchema: existingSchema,
                };
            }
        });
    } catch {
        return [];
    }
}

function parsePortFromInboundEndpoint(xmlContent: string): number | null {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlContent, 'text/xml');
        const params = Array.from(doc.querySelectorAll('parameter'));
        for (const param of params) {
            const pname = param.getAttribute('name') || '';
            if (pname === 'inbound.mcp.port' || pname === 'inbound.http.port') {
                const val = parseInt(param.textContent?.trim() || '', 10);
                if (!isNaN(val)) return val;
            }
        }
    } catch {}
    return null;
}

function generateMixedLocalEntryXml(tools: UnifiedTool[], inputSchemas: Record<string, object>): string {
    let toolsXml = '';

    tools.forEach(tool => {
        if (tool.kind === 'api') {
            const derived = inputSchemas[tool.id];
            const isEmpty = !derived || (Object.keys((derived as any).properties ?? {}).length === 0 && !(derived as any).required);
            const inputSchema = (!isEmpty ? derived : null)
                ?? (tool.inputSchema ? JSON.parse(tool.inputSchema) : null)
                ?? { type: 'object', properties: {} };
            const description = tool.description || tool.operationSummary
                || `${tool.operationMethod} ${tool.operationPath} - ${tool.apiName}`;
            toolsXml += `
            <tool name="${tool.name}">
                <api>${tool.apiName}</api>
                <resource>${tool.operationPath}</resource>
                <method>${tool.operationMethod}</method>
                <description>${description}</description>
                <inputSchema>${JSON.stringify(inputSchema)}</inputSchema>
            </tool>`;
        } else {
            toolsXml += `
            <tool name="${tool.name}">
                <sequence>${tool.sequenceName}</sequence>
                <description>${tool.description || tool.sequenceName}</description>
                <inputSchema>${tool.inputSchema}</inputSchema>
            </tool>`;
        }
    });

    return `
        <mcptools>${toolsXml}
        </mcptools>`;
}

async function buildInputSchemasForAPITools(
    tools: APITool[],
    apiDefDir: string,
    readFile: (filePath: string) => Promise<string | null>
): Promise<Record<string, object>> {
    const yamlCache: Record<string, any> = {};
    const inputSchemas: Record<string, object> = {};

    const readYaml = async (filePath: string): Promise<any> => {
        if (Object.prototype.hasOwnProperty.call(yamlCache, filePath)) return yamlCache[filePath];
        try {
            const content = await readFile(filePath);
            yamlCache[filePath] = content ? yaml.parse(content) : null;
        } catch {
            yamlCache[filePath] = null;
        }
        return yamlCache[filePath];
    };

    for (const tool of tools) {
        const rawVersion = tool.apiRawVersion || '';
        const xmlBaseName = tool.apiXmlPath
            ? pathModule.basename(tool.apiXmlPath, pathModule.extname(tool.apiXmlPath))
            : tool.apiName;

        const candidates = [
            ...(rawVersion ? [`${xmlBaseName}_v${rawVersion}.yaml`] : []),
            `${xmlBaseName}.yaml`,
        ].map(f => pathModule.join(apiDefDir, f).toString());

        let spec: any = null;
        for (const candidate of candidates) {
            spec = await readYaml(candidate);
            if (spec !== null) break;
        }

        inputSchemas[tool.id] = spec
            ? extractInputSchema(spec, tool.operationMethod, tool.operationPath)
            : { type: 'object', properties: {}, additionalProperties: false };
    }

    return inputSchemas;
}

const artifactParserConfig = {
    apis: {
        pathInStructure: (structure: any) => structure?.directoryMap?.src?.main?.wso2mi?.artifacts?.apis || [],
        parseFields: {
            id: (art: Record<string, any>) => art.name || art.id || art.fileName || '',
            name: (art: Record<string, any>) => art.name || art.id || art.fileName || '',
            context: (art: Record<string, any>) => art.context || `/${art.name || art.id || ''}`,
            version: (art: Record<string, any>) => art.version || '1.0.0',
            rawVersion: (art: Record<string, any>) => art.version ?? '',
            xmlPath: (art: Record<string, any>) => art.path || '',
        },
        parseOperations: (art: Record<string, any>): APIOperation[] => {
            const operations: APIOperation[] = [];
            if (art.resources && Array.isArray(art.resources)) {
                for (const res of art.resources) {
                    const methods = Array.isArray(res.methods)
                        ? res.methods
                        : typeof res.methods === 'string'
                        ? res.methods.split(',')
                        : [];
                    const uri = res.path || res.uri || res['uri-template'] || res.uriTemplate || '';
                    for (const m of methods) {
                        const method = String(m).toUpperCase();
                        operations.push({
                            id: `${method}_${uri}`.replace(/[^a-zA-Z0-9_]/g, '_'),
                            method,
                            path: uri,
                            summary: res.summary || ''
                        });
                    }
                }
            }
            return operations;
        }
    }
};

// ─── Add Sequence Tool Dialog ──────────────────────────────────────────────────

interface AddSequenceToolDialogProps {
    isOpen: boolean;
    sequences: Sequence[];
    onConfirm: (selected: Array<{ sequenceId: string; customName: string; description: string; inputSchema: string }>) => void;
    onCancel: () => void;
}

function AddSequenceToolDialog({ isOpen, sequences, onConfirm, onCancel }: AddSequenceToolDialogProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [customNames, setCustomNames] = useState<Record<string, string>>({});
    const [customDescriptions, setCustomDescriptions] = useState<Record<string, string>>({});
    const [inputSchemas, setInputSchemas] = useState<Record<string, string>>({});
    const [schemaErrors, setSchemaErrors] = useState<Record<string, string>>({});
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    if (!isOpen) return null;

    const toggleSequence = (id: string) => {
        const next = new Set(selectedIds);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelectedIds(next);
    };

    const handleSelectAll = () => {
        setSelectedIds(selectedIds.size === sequences.length ? new Set() : new Set(sequences.map(s => s.id)));
    };

    const validateSchema = (id: string, value: string): boolean => {
        if (!value.trim()) {
            setSchemaErrors(prev => { const n = { ...prev }; delete n[id]; return n; });
            return true;
        }
        if (convertToJsonSchema(value) === null) {
            setSchemaErrors(prev => ({ ...prev, [id]: 'Invalid JSON. Use shorthand like {"amount": number} or full JSON Schema.' }));
            return false;
        }
        setSchemaErrors(prev => { const n = { ...prev }; delete n[id]; return n; });
        return true;
    };

    const handleSchemaChange = (id: string, value: string) => {
        setInputSchemas(prev => ({ ...prev, [id]: value }));
        validateSchema(id, value);
    };

    const handleImportFile = (id: string) => { fileInputRefs.current[id]?.click(); };

    const handleFileChange = (id: string, e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setInputSchemas(prev => ({ ...prev, [id]: content }));
            validateSchema(id, content);
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleConfirm = () => {
        if (selectedIds.size === 0) return;
        if (Array.from(selectedIds).some(id => schemaErrors[id])) return;
        const emptySchema = JSON.stringify({ type: 'object', properties: {}, additionalProperties: false });
        const selected = Array.from(selectedIds).map(id => {
            const raw = inputSchemas[id]?.trim() || '';
            return {
                sequenceId: id,
                customName: customNames[id]?.trim() || id,
                description: customDescriptions[id]?.trim() || '',
                inputSchema: (raw ? convertToJsonSchema(raw) : null) || emptySchema,
            };
        });
        onConfirm(selected);
        setSelectedIds(new Set());
        setCustomNames({});
        setCustomDescriptions({});
        setInputSchemas({});
        setSchemaErrors({});
    };

    const allSelected = sequences.length > 0 && selectedIds.size === sequences.length;
    const hasSchemaErrors = Array.from(selectedIds).some(id => schemaErrors[id]);

    return (
        <DialogOverlay onClick={onCancel}>
            <DialogContent onClick={e => e.stopPropagation()}>
                <DialogTitle>Add Tools from Sequences</DialogTitle>
                <DialogField>
                    <DialogLabel>Select Sequences ({selectedIds.size} of {sequences.length})</DialogLabel>
                    {sequences.length === 0 ? (
                        <EmptyMessage>No sequences found in the project</EmptyMessage>
                    ) : (
                        <SequencesList>
                            <SelectAllRow>
                                <SequenceCheckbox
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={handleSelectAll}
                                    id="select-all-sequences"
                                />
                                <SelectAllLabel htmlFor="select-all-sequences">
                                    <strong>Select All</strong>
                                </SelectAllLabel>
                            </SelectAllRow>
                            {sequences.map(seq => (
                                <SequenceItem key={seq.id}>
                                    <SequenceItemHeader>
                                        <SequenceCheckbox
                                            type="checkbox"
                                            checked={selectedIds.has(seq.id)}
                                            onChange={() => toggleSequence(seq.id)}
                                            id={`seq-${seq.id}`}
                                        />
                                        <SequenceName>{seq.name}</SequenceName>
                                    </SequenceItemHeader>
                                    {selectedIds.has(seq.id) && (
                                        <CustomInputsContainer>
                                            <InputFieldLabel htmlFor={`name-${seq.id}`}>Tool name</InputFieldLabel>
                                            <CustomInput
                                                id={`name-${seq.id}`}
                                                type="text"
                                                placeholder={seq.name}
                                                value={customNames[seq.id] || ''}
                                                onChange={e => setCustomNames(prev => ({ ...prev, [seq.id]: e.target.value }))}
                                                onClick={e => e.stopPropagation()}
                                            />
                                            <InputFieldLabel htmlFor={`desc-${seq.id}`}>Description</InputFieldLabel>
                                            <CustomInput
                                                id={`desc-${seq.id}`}
                                                type="text"
                                                placeholder="Describe what this tool does"
                                                value={customDescriptions[seq.id] || ''}
                                                onChange={e => setCustomDescriptions(prev => ({ ...prev, [seq.id]: e.target.value }))}
                                                onClick={e => e.stopPropagation()}
                                            />
                                            <InputFieldLabel>Input Schema (JSON)</InputFieldLabel>
                                            <SchemaRow>
                                                <SchemaTextarea
                                                    placeholder='e.g. {"amount": number, "name": string}'
                                                    value={inputSchemas[seq.id] || ''}
                                                    onChange={e => handleSchemaChange(seq.id, e.target.value)}
                                                    onClick={e => e.stopPropagation()}
                                                />
                                                <SchemaImportBtn
                                                    type="button"
                                                    onClick={e => { e.stopPropagation(); handleImportFile(seq.id); }}
                                                >
                                                    Import JSON
                                                </SchemaImportBtn>
                                                <input
                                                    ref={el => { fileInputRefs.current[seq.id] = el; }}
                                                    type="file"
                                                    accept=".json"
                                                    style={{ display: 'none' }}
                                                    onChange={e => handleFileChange(seq.id, e)}
                                                />
                                            </SchemaRow>
                                            {schemaErrors[seq.id] && <SchemaError>{schemaErrors[seq.id]}</SchemaError>}
                                        </CustomInputsContainer>
                                    )}
                                </SequenceItem>
                            ))}
                        </SequencesList>
                    )}
                </DialogField>
                <DialogButtonGroup>
                    <DialogCancelBtn onClick={onCancel}>Cancel</DialogCancelBtn>
                    {selectedIds.size > 0 && (
                        <SelectionInfo>{selectedIds.size} sequence{selectedIds.size !== 1 ? 's' : ''} selected</SelectionInfo>
                    )}
                    <DialogAddBtn onClick={handleConfirm} disabled={selectedIds.size === 0 || hasSchemaErrors}>
                        Add Selected ({selectedIds.size})
                    </DialogAddBtn>
                </DialogButtonGroup>
            </DialogContent>
        </DialogOverlay>
    );
}

// ─── Form Schema ──────────────────────────────────────────────────────────────

const schema = yup.object({
    serverName: yup.string()
        .required('Server name is required')
        .min(3, 'Server name must be at least 3 characters')
        .matches(/^[a-zA-Z0-9_-]+$/, 'Server name can only contain letters, numbers, hyphens, and underscores'),
    port: yup.number()
        .typeError('Port must be a number')
        .required('Port is required')
        .integer('Port must be an integer'),
});

// ─── Props ────────────────────────────────────────────────────────────────────

export interface MCPServerEditData {
    serverName: string;
    localEntryPath?: string;
    tools?: Array<{
        id: string;
        name: string;
        description: string;
        apiId: string;
        apiName: string;
        apiVersion: string;
        apiRawVersion: string;
        apiXmlPath: string;
        operationId: string;
        operationMethod: string;
        operationPath: string;
        operationSummary: string;
    }>;
}

export interface MCPServerFromAPIsFormProps {
    path: string;
    editData?: MCPServerEditData;
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export function MCPServerFromAPIsForm({ path, editData }: MCPServerFromAPIsFormProps) {
    const isEditMode = !!editData;
    const { rpcClient } = useVisualizerContext();
    const { register, handleSubmit, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: { serverName: editData?.serverName ?? '', port: 8300 },
    });

    const [apis, setApis] = useState<API[]>([]);
    const [sequences, setSequences] = useState<Sequence[]>([]);
    const [tools, setTools] = useState<UnifiedTool[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAddAPIDialog, setShowAddAPIDialog] = useState(false);
    const [showAddSeqDialog, setShowAddSeqDialog] = useState(false);
    const [showToolTypeSelector, setShowToolTypeSelector] = useState(false);
    const [selectedAPIForTool, setSelectedAPIForTool] = useState<string>('');

    // Load project structure (APIs + sequences) and, if editing, existing tools from XML
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                let projectUri = path;
                const artifactsIndex = projectUri.indexOf('/artifacts');
                if (artifactsIndex !== -1) {
                    projectUri = projectUri.substring(0, artifactsIndex).replace(/\/src\/main\/wso2mi$/, '');
                }

                const projectStructure = await rpcClient.getMiVisualizerRpcClient().getProjectStructure({
                    documentUri: projectUri,
                });

                // Parse APIs
                const apiArtifacts = artifactParserConfig.apis.pathInStructure(projectStructure);
                const parsedAPIs: API[] = apiArtifacts.map((art: Record<string, any>) => ({
                    id: artifactParserConfig.apis.parseFields.id(art),
                    name: artifactParserConfig.apis.parseFields.name(art),
                    context: artifactParserConfig.apis.parseFields.context(art),
                    version: artifactParserConfig.apis.parseFields.version(art),
                    rawVersion: artifactParserConfig.apis.parseFields.rawVersion(art),
                    xmlPath: artifactParserConfig.apis.parseFields.xmlPath(art),
                    operations: artifactParserConfig.apis.parseOperations(art),
                }));
                setApis(parsedAPIs);

                // Parse sequences
                const seqArtifacts: any[] =
                    projectStructure?.directoryMap?.src?.main?.wso2mi?.artifacts?.sequences || [];
                const parsedSeqs: Sequence[] = seqArtifacts
                    .map((art: any) => ({
                        id: art.name || art.id || art.fileName || '',
                        name: art.name || art.id || art.fileName || '',
                        xmlPath: art.path || '',
                    }))
                    .filter(s => s.id !== '');
                setSequences(parsedSeqs);

                // If editing with a localEntryPath, load existing tools from XML
                if (isEditMode && editData?.localEntryPath) {
                    const resp = await rpcClient.getMiDiagramRpcClient().readIdpSchemaFileContent({
                        filePath: editData.localEntryPath,
                    });
                    if (resp.fileContent) {
                        setTools(parseToolsFromXML(resp.fileContent));
                    }

                    // Derive inbound endpoint path to read the port
                    const inboundPath = editData.localEntryPath
                        .replace('/local-entries/', '/inbound-endpoints/')
                        .replace('-mcp-config.xml', '-endpoint.xml');
                    try {
                        const inboundResp = await rpcClient.getMiDiagramRpcClient().readIdpSchemaFileContent({
                            filePath: inboundPath,
                        });
                        if (inboundResp.fileContent) {
                            const port = parsePortFromInboundEndpoint(inboundResp.fileContent);
                            if (port !== null) {
                                setValue('port', port);
                            }
                        }
                    } catch {}
                } else if (isEditMode && editData?.tools) {
                    // Legacy: pre-parsed API tools from MCPServerList
                    setTools(editData.tools.map(t => ({ ...t, kind: 'api' as const })));
                }
            } catch (err) {
                setError(`Failed to load project data: ${err instanceof Error ? err.message : String(err)}`);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [rpcClient, path]);

    // ─── Add API tools ──────────────────────────────────────────────────────────

    const confirmAddAPITools = (
        apiId: string,
        selectedOperations: Array<{ id: string; customName: string; description: string }>
    ) => {
        const api = apis.find(a => a.id === apiId);
        if (!api) return;

        const newTools: APITool[] = selectedOperations
            .map(selectedOp => {
                const operation = api.operations.find(o => o.id === selectedOp.id);
                if (!operation) return null;
                const defaultName = `${operation.method}_${cleanPathForToolName(operation.path)}`;
                return {
                    kind: 'api' as const,
                    id: crypto.randomUUID(),
                    name: selectedOp.customName.trim() || defaultName,
                    description: selectedOp.description.trim(),
                    apiId: api.id,
                    apiName: api.name,
                    apiVersion: api.version,
                    apiRawVersion: api.rawVersion,
                    apiXmlPath: api.xmlPath,
                    operationId: operation.id,
                    operationMethod: operation.method,
                    operationPath: operation.path,
                    operationSummary: operation.summary || '',
                };
            })
            .filter((t): t is NonNullable<typeof t> => t !== null) as APITool[];

        setTools(prev => [...prev, ...newTools]);
        setShowAddAPIDialog(false);
        setSelectedAPIForTool('');
        setError(null);
    };

    // ─── Add sequence tools ─────────────────────────────────────────────────────

    const confirmAddSeqTools = (
        selected: Array<{ sequenceId: string; customName: string; description: string; inputSchema: string }>
    ) => {
        const existing = new Set(
            tools.filter((t): t is SequenceTool => t.kind === 'sequence').map(t => t.sequenceName)
        );
        const newTools: SequenceTool[] = selected
            .filter(s => !existing.has(s.sequenceId))
            .map(s => ({
                kind: 'sequence' as const,
                id: crypto.randomUUID(),
                name: s.customName,
                description: s.description,
                sequenceName: s.sequenceId,
                sequenceXmlPath: sequences.find(sq => sq.id === s.sequenceId)?.xmlPath || '',
                inputSchema: s.inputSchema,
            }));
        setTools(prev => [...prev, ...newTools]);
        setShowAddSeqDialog(false);
        setError(null);
    };

    const removeTool = (toolId: string) => setTools(tools.filter(t => t.id !== toolId));

    // ─── Submit ─────────────────────────────────────────────────────────────────

    const onSubmit = async (data: any) => {
        setSubmitting(true);
        setError(null);
        try {
            const projectRootResp = await rpcClient.getMiDiagramRpcClient().getProjectRoot({ path });
            const projectDir = projectRootResp.path;

            const localEntriesDir = pathModule.join(projectDir, 'src', 'main', 'wso2mi', 'artifacts', 'local-entries').toString();
            const inboundEndpointsDir = pathModule.join(projectDir, 'src', 'main', 'wso2mi', 'artifacts', 'inbound-endpoints').toString();
            const apiDefDir = pathModule.join(projectDir, 'src', 'main', 'wso2mi', 'resources', 'api-definitions').toString();

            const apiTools = tools.filter((t): t is APITool => t.kind === 'api');
            const inputSchemas = await buildInputSchemasForAPITools(
                apiTools,
                apiDefDir,
                async (filePath) => {
                    const resp = await rpcClient.getMiDiagramRpcClient().readIdpSchemaFileContent({ filePath });
                    return resp.fileContent ?? null;
                }
            );

            const localEntryName = `${data.serverName}-mcp-config`;
            const localEntryXml = generateMixedLocalEntryXml(tools, inputSchemas);

            await rpcClient.getMiDiagramRpcClient().createLocalEntry({
                directory: localEntriesDir,
                name: localEntryName,
                type: 'In-Line XML Entry',
                value: localEntryXml,
                URL: '',
                getContentOnly: false,
            });

            await rpcClient.getMiDiagramRpcClient().createInboundEndpoint({
                directory: inboundEndpointsDir,
                attributes: {
                    name: `${data.serverName}-endpoint`,
                    sequence: '',
                    onError: '',
                    class: 'org.wso2.carbon.inbound.SSE.McpInboundListener',
                },
                parameters: {
                    'inbound.mcp.port': data.port,
                    'inbound.http.port': data.port,
                    'inbound.http.context': '/mcp',
                    'mcp.tools.localentry': localEntryName,
                    'inbound.behavior': 'listening',
                },
            });

            rpcClient.getMiVisualizerRpcClient().showNotification({
                message: isEditMode
                    ? `MCP Server "${data.serverName}" updated with ${tools.length} tool(s)`
                    : `MCP Server "${data.serverName}" created with ${tools.length} tool(s)`,
                type: 'info',
            });

            rpcClient.getMiVisualizerRpcClient().openView({
                type: EVENT_TYPE.OPEN_VIEW,
                location: { view: MACHINE_VIEW.Overview },
            });
        } catch (err) {
            setError(`Failed to save MCP Server: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Render ─────────────────────────────────────────────────────────────────

    const title = isEditMode
        ? `Edit MCP Server: ${editData!.serverName}`
        : 'Create MCP Server from APIs';

    return (
        <View>
            <ViewHeader
                title={showToolTypeSelector
                    ? 'Add Tool'
                    : isEditMode ? 'Edit MCP Server' : 'Create MCP Server'}
                icon="server"
            />
            <ViewContent padding>
                {showToolTypeSelector ? (
                    <ToolTypePage>
                        <div>
                            <Title>Select Tool Type</Title>
                            <Description>
                                Choose how you want to expose functionality as an MCP tool.
                            </Description>
                        </div>

                        <ToolTypePageCards>
                            <ToolTypePageCard
                                onClick={() => {
                                    setShowToolTypeSelector(false);
                                    setShowAddAPIDialog(true);
                                    setSelectedAPIForTool('');
                                }}
                            >
                                <ToolTypePageCardTitle>From APIs</ToolTypePageCardTitle>
                                <ToolTypePageCardDesc>
                                    Expose an API operation as a tool. Select from existing REST API
                                    resources defined in this project.
                                </ToolTypePageCardDesc>
                            </ToolTypePageCard>

                            <ToolTypePageCard
                                onClick={() => {
                                    setShowToolTypeSelector(false);
                                    setShowAddSeqDialog(true);
                                }}
                            >
                                <ToolTypePageCardTitle>From Sequences</ToolTypePageCardTitle>
                                <ToolTypePageCardDesc>
                                    Expose a mediation sequence as a tool. Select from existing
                                    sequences defined in this project.
                                </ToolTypePageCardDesc>
                            </ToolTypePageCard>
                        </ToolTypePageCards>

                        <BackBtn onClick={() => setShowToolTypeSelector(false)}>
                            ← Back
                        </BackBtn>
                    </ToolTypePage>
                ) : (
                    <Container>
                        <div>
                            <Title>{title}</Title>
                            <Description>
                                {isEditMode
                                    ? 'Add or remove tools from this MCP server. Tools can be backed by API operations or sequences.'
                                    : 'Select API operations to expose as MCP tools.'}
                            </Description>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)}>
                            {isEditMode ? (
                                <InfoPanel>
                                    <InfoRow>
                                        <InfoLabel>Server Name</InfoLabel>
                                        <InfoValue>{editData!.serverName}</InfoValue>
                                    </InfoRow>
                                    <InfoRow>
                                        <InfoLabel>Port</InfoLabel>
                                        {loading ? (
                                            <InfoValue>...</InfoValue>
                                        ) : (
                                            <div style={{ flex: 1 }}>
                                                <TextField
                                                    placeholder="e.g., 8300"
                                                    {...register('port')}
                                                />
                                                {errors.port && (
                                                    <ErrorMessage style={{ marginTop: '6px' }}>
                                                        {String(errors.port?.message)}
                                                    </ErrorMessage>
                                                )}
                                            </div>
                                        )}
                                    </InfoRow>
                                </InfoPanel>
                            ) : (
                                <>
                                    <FormSection>
                                        <SectionLabel>Server Name</SectionLabel>
                                        <TextField
                                            placeholder="e.g., my-mcp-server"
                                            {...register('serverName')}
                                        />
                                        {errors.serverName && (
                                            <ErrorMessage>{String(errors.serverName?.message)}</ErrorMessage>
                                        )}
                                    </FormSection>

                                    <FormSection>
                                        <SectionLabel>Port</SectionLabel>
                                        <TextField
                                            placeholder="e.g., 8300"
                                            {...register('port')}
                                        />
                                        {errors.port && (
                                            <ErrorMessage>{String(errors.port?.message)}</ErrorMessage>
                                        )}
                                    </FormSection>
                                </>
                            )}

                            <FormSection>
                                <ToolsSectionHeader>
                                    <SectionLabel>Tools ({tools.length})</SectionLabel>
                                    <AddToolBtn
                                        type="button"
                                        onClick={() => setShowToolTypeSelector(true)}
                                        disabled={loading}
                                    >
                                        + Add Tool
                                    </AddToolBtn>
                                </ToolsSectionHeader>

                                {tools.length === 0 ? (
                                    <EmptyMessage>No tools added yet. Use the buttons above to add API or sequence tools.</EmptyMessage>
                                ) : (
                                    <ToolsList>
                                        {tools.map(tool => (
                                            <ToolItem key={tool.id}>
                                                <ToolInfo>
                                                    <ToolName>{tool.name}</ToolName>
                                                    {tool.description && (
                                                        <ToolDescription>{tool.description}</ToolDescription>
                                                    )}
                                                </ToolInfo>
                                                {tool.kind === 'api' ? (
                                                    <ToolMeta>
                                                        <MethodBadge method={tool.operationMethod} style={{ marginRight: '4px' }}>
                                                            {tool.operationMethod}
                                                        </MethodBadge>
                                                        {tool.operationPath} ({tool.apiName})
                                                    </ToolMeta>
                                                ) : (
                                                    <ToolMeta>
                                                        <SeqBadge style={{ marginRight: '4px' }}>SEQUENCE</SeqBadge>
                                                        {tool.sequenceName}
                                                    </ToolMeta>
                                                )}
                                                <RemoveBtn
                                                    onClick={() => removeTool(tool.id)}
                                                    aria-label={`Remove tool ${tool.name}`}
                                                >
                                                    ✕
                                                </RemoveBtn>
                                            </ToolItem>
                                        ))}
                                    </ToolsList>
                                )}
                            </FormSection>

                            {error && <ErrorMessage>{error}</ErrorMessage>}

                            <ButtonGroup>
                                <Button
                                    appearance="secondary"
                                    onClick={() => rpcClient.getMiVisualizerRpcClient().openView({
                                        type: EVENT_TYPE.OPEN_VIEW,
                                        location: { view: MACHINE_VIEW.Overview },
                                    })}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    appearance="primary"
                                    disabled={submitting || loading}
                                    onClick={handleSubmit(onSubmit)}
                                >
                                    {submitting
                                        ? (isEditMode ? 'Saving...' : 'Creating...')
                                        : isEditMode
                                            ? `Save Changes (${tools.length} tool${tools.length !== 1 ? 's' : ''})`
                                            : `Create MCP Server (${tools.length} tool${tools.length !== 1 ? 's' : ''})`}
                                </Button>
                            </ButtonGroup>
                        </form>
                    </Container>
                )}

                <AddToolDialog
                    isOpen={showAddAPIDialog}
                    apis={apis}
                    selectedAPIForTool={selectedAPIForTool}
                    onAPIChange={setSelectedAPIForTool}
                    onConfirmBulk={confirmAddAPITools}
                    onCancel={() => { setShowAddAPIDialog(false); setSelectedAPIForTool(''); }}
                />

                <AddSequenceToolDialog
                    isOpen={showAddSeqDialog}
                    sequences={sequences}
                    onConfirm={confirmAddSeqTools}
                    onCancel={() => setShowAddSeqDialog(false)}
                />
            </ViewContent>
        </View>
    );
}

export default MCPServerFromAPIsForm;
