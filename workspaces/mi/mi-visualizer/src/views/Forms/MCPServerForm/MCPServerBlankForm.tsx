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
import { Button } from '@wso2/ui-toolkit';
import { useVisualizerContext } from '@wso2/mi-rpc-client';
import { EVENT_TYPE } from '@wso2/mi-core';
import { View, ViewContent, ViewHeader } from '../../../components/View';

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

const HelpText = styled.div`
    color: var(--vscode-descriptionForeground);
    font-size: 12px;
    margin-top: -10px;
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

export interface MCPServerBlankFormProps {
    path: string;
}

export function MCPServerBlankForm({ path }: MCPServerBlankFormProps) {
    const { rpcClient } = useVisualizerContext();

    return (
        <View>
            <ViewHeader title="Create Blank MCP Server" icon="server" />
            <ViewContent padding>
                <Container>
                    <div>
                        <Title>Create a New Blank MCP Server</Title>
                        <Description>
                            Create a New Blank MCP Server
                        </Description>
                    </div>

                    <ButtonGroup>
                        <Button
                            appearance="secondary"
                            onClick={() => {
                                rpcClient.getMiVisualizerRpcClient().openView({
                                    type: EVENT_TYPE.OPEN_VIEW,
                                    location: { view: 'MCPServerForm' as any, documentUri: path }
                                });
                            }}
                        >
                            Back
                        </Button>
                    </ButtonGroup>
                </Container>
            </ViewContent>
        </View>
    );
}

export default MCPServerBlankForm;
