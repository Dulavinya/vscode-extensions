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

import { useState } from 'react';
import styled from '@emotion/styled';
import { TextField, Button, FormView, FormActions } from '@wso2/ui-toolkit';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { MACHINE_VIEW, EVENT_TYPE } from '@wso2/mi-core';
import { useVisualizerContext } from '@wso2/mi-rpc-client';
import * as pathModule from 'path';

const ErrorMessage = styled.div`
    color: var(--vscode-inputValidation-errorBorder);
    padding: 10px;
    border: 1px solid var(--vscode-inputValidation-errorBorder);
    border-radius: 4px;
    background: var(--vscode-inputValidation-errorBackground);
    font-size: 12px;
`;

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

export interface MCPServerWizardProps {
    path: string;
    forceCreate?: boolean;
}

export function MCPServerWizard({ path }: MCPServerWizardProps) {
    const { rpcClient } = useVisualizerContext();
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: { serverName: '', port: 8300 },
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClose = () => {
        rpcClient.getMiVisualizerRpcClient().openView({
            type: EVENT_TYPE.OPEN_VIEW,
            location: { view: MACHINE_VIEW.Overview },
        });
    };

    const onSubmit = async (data: any) => {
        setSubmitting(true);
        setError(null);
        try {
            const projectRootResp = await rpcClient.getMiDiagramRpcClient().getProjectRoot({ path });
            const projectDir = projectRootResp.path;

            const localEntriesDir = pathModule.join(projectDir, 'src', 'main', 'wso2mi', 'artifacts', 'local-entries').toString();
            const inboundEndpointsDir = pathModule.join(projectDir, 'src', 'main', 'wso2mi', 'artifacts', 'inbound-endpoints').toString();

            const localEntryName = `${data.serverName}-mcp-config`;
            const emptyXml = `\n        <mcptools>\n        </mcptools>`;

            await rpcClient.getMiDiagramRpcClient().createLocalEntry({
                directory: localEntriesDir,
                name: localEntryName,
                type: 'In-Line XML Entry',
                value: emptyXml,
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
                message: `MCP Server "${data.serverName}" created. Select it from the project panel to add tools.`,
                type: 'info',
            });

            handleClose();
        } catch (err) {
            setError(`Failed to create MCP Server: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <FormView title="Create MCP Server" onClose={handleClose}>
            <TextField
                required
                label="Server Name"
                placeholder="e.g., my-mcp-server"
                {...register('serverName')}
                errorMsg={errors.serverName ? String(errors.serverName.message) : undefined}
            />
            <TextField
                required
                label="Port"
                placeholder="e.g., 8300"
                {...register('port')}
                errorMsg={errors.port ? String(errors.port.message) : undefined}
            />
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <FormActions>
                <Button
                    appearance="primary"
                    disabled={submitting}
                    onClick={handleSubmit(onSubmit)}
                >
                    {submitting ? 'Creating...' : 'Create MCP Server'}
                </Button>
                <Button appearance="secondary" onClick={handleClose}>
                    Cancel
                </Button>
            </FormActions>
        </FormView>
    );
}

export default MCPServerWizard;
