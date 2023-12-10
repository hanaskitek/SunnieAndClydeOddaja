import { vec3, mat3, mat4 } from './lib/gl-matrix-module.js';

import * as WebGPU from './common/engine/WebGPU.js';

import { Camera } from './common/engine/core.js';
import { Transform } from './common/engine/core/Transform.js';
import { BaseRenderer } from './common/engine/renderers/BaseRenderer.js';

import {
    getLocalModelMatrix,
    getGlobalViewMatrix,
    getProjectionMatrix,
    getModels,
} from './common/engine/core/SceneUtils.js';

import {
    createVertexBuffer,
} from './common/engine/core/VertexUtils.js';

import { Light } from './Light.js';

const vertexBufferLayout = {
    arrayStride: 32,
    attributes: [
        {
            name: 'position',
            shaderLocation: 0,
            offset: 0,
            format: 'float32x3',
        },
        {
            name: 'texcoords',
            shaderLocation: 1,
            offset: 12,
            format: 'float32x2',
        },
        {
            name: 'normal',
            shaderLocation: 2,
            offset: 20,
            format: 'float32x3',
        },
    ],
};

const cameraBindGroupLayout = {
    entries: [
        {
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: {},
        },
    ],
};

const lightBindGroupLayout = {
    entries: [
        {
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: {},
        },
        // Bindingi za sence
        {
            binding: 1,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: {
              type: 'uniform',
            },
        },
        {
            binding: 2,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            texture: {
              sampleType: 'depth',
            },
        },
        {
            binding: 3,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            sampler: {
              type: 'comparison',
            },
        },
    ],
};
const lightBindGroupLayoutShadow = {
    entries: [
        {
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: {},
        },
    ],
};


const modelBindGroupLayout = {
    entries: [
        {
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: {},
        },
    ],
};

const materialBindGroupLayout = {
    entries: [
        {
            binding: 0,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {},
        },
        {
            binding: 1,
            visibility: GPUShaderStage.FRAGMENT,
            texture: {},
        },
        {
            binding: 2,
            visibility: GPUShaderStage.FRAGMENT,
            sampler: {},
        },
    ],
};

export class Renderer extends BaseRenderer {

    constructor(canvas) {
        super(canvas);
        this.perFragment = true;
        this.shadowFramebuffer = null;
        this.shadowRenderPipeline = null;
    }
    

    async initialize() {
        await super.initialize();

        const codePerFragment = await fetch('lambertPerFragment.wgsl').then(response => response.text());
        const codePerVertex = await fetch('lambertPerVertex.wgsl').then(response => response.text());

        const modulePerFragment = this.device.createShaderModule({ code: codePerFragment });
        const modulePerVertex = this.device.createShaderModule({ code: codePerVertex });

        this.cameraBindGroupLayout = this.device.createBindGroupLayout(cameraBindGroupLayout);
        this.lightBindGroupLayout = this.device.createBindGroupLayout(lightBindGroupLayout);
        this.lightBindGroupLayoutShadow = this.device.createBindGroupLayout(lightBindGroupLayoutShadow);
        this.modelBindGroupLayout = this.device.createBindGroupLayout(modelBindGroupLayout);
        this.materialBindGroupLayout = this.device.createBindGroupLayout(materialBindGroupLayout);
        
    

        // Initialize Shadow Mapping Resources
        this.shadowDepthTexture = this.device.createTexture({
            size: { width: 8192, height: 8192, depthOrArrayLayers: 1 },  //width: 2048, height: 2048
            format: 'depth32float',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
        });
        this.shadowDepthTextureView = this.shadowDepthTexture.createView();

        this.shadowFramebuffer = this.device.createRenderBundleEncoder({
            colorFormats: [],
            depthStencilFormat: 'depth32float',
            depthReadOnly: false,
            stencilReadOnly: false
        }).finish();

        // SHADOW MAP SAMPLER
        this.shadowSampler = this.device.createSampler({
            // magFilter: 'linear',
            // minFilter: 'linear',
            // mipmapFilter: 'linear',
            // addressModeU: 'clamp-to-edge',
            // addressModeV: 'clamp-to-edge',
            compare: 'less',
        });

        // Creating Shadow Mapping Pipeline
        const shadowVertexShaderCode = await fetch('shadowVertexShader.wgsl').then(response => response.text());
        const shadowVertexShaderModule = this.device.createShaderModule({ code: shadowVertexShaderCode });


  

        this.shadowPipeline = await this.device.createRenderPipelineAsync({
            vertex: {
                module: shadowVertexShaderModule,
                entryPoint: 'main',
                buffers: [vertexBufferLayout],
            },
            // fragment: {
            //     module: modulePerFragment,
            //     entryPoint: 'fragment',
            //     targets: [{ format: this.format }],
            // },
        // No fragment shader as we're only interested in depth
            //: this.device.createPipelineLayout({ bindGroupLayouts: [this.cameraBindGroupLayout] }),
            depthStencil: {
                format: 'depth32float', // Match the shadow map texture format
                depthWriteEnabled: true,
                depthCompare: 'less',
            },
            // primitive: {
            //     topology: 'triangle-list'
            // },
            layout :  this.device.createPipelineLayout({
                bindGroupLayouts: [
                    this.cameraBindGroupLayout,
                    this.lightBindGroupLayoutShadow,
                    this.modelBindGroupLayout,
                    this.materialBindGroupLayout,
                ],
            }),
        });

        const layout = this.device.createPipelineLayout({
            bindGroupLayouts: [
                this.cameraBindGroupLayout,
                this.lightBindGroupLayout,
                this.modelBindGroupLayout,
                this.materialBindGroupLayout,
            ],
        });


        // const layout = this.device.createPipelineLayout({
        //     bindGroupLayouts: [
        //         this.cameraBindGroupLayout,
        //         this.lightBindGroupLayout,
        //         this.modelBindGroupLayout,
        //         this.materialBindGroupLayout,
        //     ],
        // });

        this.pipelinePerFragment = await this.device.createRenderPipelineAsync({
            vertex: {
                module: modulePerFragment,
                entryPoint: 'vertex',
                buffers: [ vertexBufferLayout ],
            },
            fragment: {
                module: modulePerFragment,
                entryPoint: 'fragment',
                targets: [{ format: this.format }],
            },
            depthStencil: {
                format: 'depth24plus-stencil8',
                depthWriteEnabled: true,
                depthCompare: 'less',
            },
            layout,    
        });

        this.pipelinePerVertex = await this.device.createRenderPipelineAsync({
            vertex: {
                module: modulePerVertex,
                entryPoint: 'vertex',
                buffers: [ vertexBufferLayout ],
            },
            fragment: {
                module: modulePerVertex,
                entryPoint: 'fragment',
                targets: [{ format: this.format }],
            },
            depthStencil: {
                format: 'depth24plus-stencil8',
                depthWriteEnabled: true,
                depthCompare: 'less',
            },
            layout,
        });

        this.recreateDepthTexture();
        // this.encoder = this.device.createCommandEncoder();
    }

    recreateDepthTexture() {
        this.depthTexture?.destroy();
        this.depthTexture = this.device.createTexture({
            format: 'depth24plus-stencil8',
            size: [this.canvas.width, this.canvas.height],
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
    }

    drawingDepthTexture(){
        const depthTexture = device.createTexture({
            size: { width: canvas.width, height: canvas.height, depthOrArrayLayers: 1 },
            format: 'depth24plus-stencil8',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

    }

    prepareNode(node) {
        if (this.gpuObjects.has(node)) {
            return this.gpuObjects.get(node);
        }

        const modelUniformBuffer = this.device.createBuffer({
            size: 128,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const modelBindGroup = this.device.createBindGroup({
            layout: this.modelBindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: modelUniformBuffer } },
            ],
        });

        const gpuObjects = { modelUniformBuffer, modelBindGroup };
        this.gpuObjects.set(node, gpuObjects);
        return gpuObjects;
    }

    prepareCamera(camera) {
        if (this.gpuObjects.has(camera)) {
            return this.gpuObjects.get(camera);
        }

        const cameraUniformBuffer = this.device.createBuffer({
            size: 128,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const cameraBindGroup = this.device.createBindGroup({
            layout: this.cameraBindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: cameraUniformBuffer } },
            ],
        });

        const gpuObjects = { cameraUniformBuffer, cameraBindGroup };
        this.gpuObjects.set(camera, gpuObjects);
        return gpuObjects;
    }

    prepareLight(light, shadow = false) {
        // if (this.gpuObjects.has(light)) {
        //     return this.gpuObjects.get(light);
        // }
       
        if (shadow == false) {
            const lightUniformBuffer = this.device.createBuffer({
                size: 32,//36,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });

            const sceneUniformBuffer = this.device.createBuffer({
                size: 4 * 16,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });

            const lightBindGroup = this.device.createBindGroup({
                layout: this.lightBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: lightUniformBuffer } },
                    { binding: 1, resource: { buffer: sceneUniformBuffer } },
                    { binding: 2, resource: this.shadowDepthTextureView },
                    { binding: 3, resource: this.shadowSampler },
                ],
            });

            const gpuObjects = { sceneUniformBuffer, lightUniformBuffer, lightBindGroup };
            this.gpuObjects.set(light, gpuObjects);
            return gpuObjects;
        } else {    
            const lightUniformBuffer2 = this.device.createBuffer({
                size: 32,//36,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });

            const lightBindGroup2 = this.device.createBindGroup({
                layout: this.lightBindGroupLayoutShadow,
                entries: [
                    { binding: 0, resource: { buffer: lightUniformBuffer2 } }
                ],
            });
            const gpuObjects = {lightUniformBuffer2, lightBindGroup2 };
            this.gpuObjects.set(light, gpuObjects);
            return gpuObjects;
        
        }
    }
    prepareMaterial(material){
        if (this.gpuObjects.has(material)) {
            return this.gpuObjects.get(material);
        }

        const baseTexture = this.prepareImage(material.baseTexture.image).gpuTexture;
        const baseSampler = this.prepareSampler(material.baseTexture.sampler).gpuSampler;

        const materialUniformBuffer = this.device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const materialBindGroup = this.device.createBindGroup({
            layout: this.materialBindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: materialUniformBuffer } },
                { binding: 1, resource: baseTexture.createView() },
                { binding: 2, resource: baseSampler },
            ],
        });

        const gpuObjects = { materialUniformBuffer, materialBindGroup };
        this.gpuObjects.set(material, gpuObjects);
        return gpuObjects;
    }

    // prepareShadow() {
    //     const sceneUniformBuffer = device.createBuffer({
    //         size: 4 * 16,
    //         usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    //     });

    //     const shadowBindGroup = this.device.createBindGroup({
    //         layout: this.shadowBindGroupLayout,
    //         entries: [
    //             { binding: 0, resource: { buffer: this.sceneUniformBuffer } },
    //             { binding: 1, resource: this.shadowDepthTextureView },
    //             { binding: 2, resource: this.shadowSampler },
    //         ],
    //     });

    //     const vrniOba = { sceneUniformBuffer, shadowBindGroup };

    //     return vrniOba;
    // }

    async showShadowMap() {
        const showShadowMapShaderCode = await fetch('showShadowMapShader.wgsl').then(response => response.text());
        const showShadowMapShaderModule = this.device.createShaderModule({ code: showShadowMapShaderCode });

        const vertexBufferLayout2 = {
            arrayStride: 16,
            attributes: [
                {
                    name: 'position',
                    shaderLocation: 0,
                    offset: 0,
                    format: 'float32x2',
                },
                {
                    name: 'texcoords',
                    shaderLocation: 1,
                    offset: 8,
                    format: 'float32x2',
                },
            ],
        };

        // pipeline
        this.pipelinePerFragmentShadowMap = await this.device.createRenderPipelineAsync({
            vertex: {
                module: showShadowMapShaderModule,
                entryPoint: 'vertex',
                buffers: [ vertexBufferLayout2 ],
            },
            fragment: {
                module: showShadowMapShaderModule,
                entryPoint: 'fragment',
                targets: [{ format: this.format }],
            },
            layout: 'auto', 
        });

        // quad
        const vertexData = new Float32Array([
            // positions   // texture coordinates
            -1.0, -1.0,    0.0, 0.0,
             1.0, -1.0,    1.0, 0.0,
            -1.0,  1.0,    0.0, 1.0,
             1.0,  1.0,    1.0, 1.0,
        ]);

        // buffer
        const vertexBufferShowShadow = this.device.createBuffer({
            size: vertexData.byteLength,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true,
        });
        new Float32Array(vertexBufferShowShadow.getMappedRange()).set(vertexData);
        vertexBufferShowShadow.unmap();

        const indices = new Uint32Array([
            0, 1, 2,
            2, 1, 3,
        ]);

        const indexBufferShowShadow = this.device.createBuffer({
            size: indices.byteLength,
            usage: GPUBufferUsage.INDEX,
            mappedAtCreation: true,
        });

        new Uint32Array(indexBufferShowShadow.getMappedRange()).set(indices);
        indexBufferShowShadow.unmap();

        const sampler = this.device.createSampler({
            magFilter: 'nearest',
            minFilter: 'nearest',
        });
        
        const bindGroupShowShadow = this.device.createBindGroup({
            layout: this.pipelinePerFragmentShadowMap.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: this.shadowDepthTexture.createView(),
                },
                {
                    binding: 1,
                    resource: sampler,
                },
            ],
        });

        const encoderShadow = this.device.createCommandEncoder();
        const renderPass = encoderShadow.beginRenderPass({
            colorAttachments: [
                {
                    view: this.context.getCurrentTexture().createView(),
                    clearValue: [1, 1, 1, 1],
                    loadOp: 'clear',
                    storeOp: 'store',
                }
            ]
        });
        renderPass.setPipeline(this.pipelinePerFragmentShadowMap);
        renderPass.setBindGroup(0, bindGroupShowShadow);
        renderPass.setVertexBuffer(0, vertexBufferShowShadow);
        renderPass.setIndexBuffer(indexBufferShowShadow, 'uint32');
        renderPass.drawIndexed(6);
        renderPass.end();
        this.device.queue.submit([encoderShadow.finish()]);

        // bind group layout
        // const showShadowMapBindGroupLayout = {
        //     entries: [
        //         {
        //             binding: 2,
        //             visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        //             texture: {
        //                 sampleType: 'depth',
        //             },
        //         },
        //     ],
        // };




    }

    renderShadowMap(scene, camera, light) {
       this.encoder = this.device.createCommandEncoder();
        const passDescriptor = {
            colorAttachments: [
                // {
                //     view: this.context.getCurrentTexture().createView(),
                //     clearValue: [1, 1, 1, 1],
                //     loadOp: 'clear',
                //     storeOp: 'store',
                // }
            ],
            depthStencilAttachment: {
                view: this.shadowDepthTextureView,//.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store', 
            },
        };
        this.renderPass = this.encoder.beginRenderPass(passDescriptor);
        this.renderPass.setPipeline(this.shadowPipeline);
    
        // Set up light camera bind group and render the scene
        // LOOP THROUGH ALL OBJECTS AND RENDER THEM
        //Poskusna koda        
        const cameraComponent = camera.getComponentOfType(Camera);
        const viewMatrix = getGlobalViewMatrix(camera);
        const projectionMatrix = getProjectionMatrix(camera);
        this.lightViewProjectionMatrix = mat4.create();
        mat4.multiply(this.lightViewProjectionMatrix, projectionMatrix, viewMatrix);      // Shranimo matriko za kasnejso uporabo.

        //Poskusimo svoje matrike 
        // const lightPosition = vec3.fromValues(camera.getComponentOfType(Transform).translation[0], camera.getComponentOfType(Transform).translation[1], camera.getComponentOfType(Transform).translation[2]);
        
        // let upVector = vec3.fromValues(0, 1, 0);
        // let origin = vec3.fromValues(0, 0, 0);
        // let lightViewMatrix = mat4.create();
        // mat4.lookAt(lightViewMatrix,lightPosition, origin, upVector);
        // let lightProjectionMatrix = mat4.create();
        // {
        //     const left = -80;
        //     const right = 80;
        //     const bottom = -80;
        //     const top = 80;
        //     const near = -200;
        //     const far = 300;
        //     mat4.ortho(lightProjectionMatrix,left, right, bottom, top, near, far);
        // }
        // {
        //     const fovy = camera.getComponentOfType(Camera).fovy;
        //     const aspect = camera.getComponentOfType(Camera).aspect;
        //     const near = camera.getComponentOfType(Camera).near;
        //     const far = camera.getComponentOfType(Camera).far;
        //     console.log(fovy, aspect, near, far);
        //     mat4.ortho(lightProjectionMatrix, fovy, aspect, near, far);
        // }

        
        // let lightViewProjMatrix2 =mat4.create();
        //  mat4.multiply(lightViewProjMatrix2,
        //     lightProjectionMatrix,
        //     lightViewMatrix
        // );
        // this.lightViewProjectionMatrix = lightViewProjMatrix2;
        // const viewMatrix2 = lightViewMatrix;
        // const projectionMatrix2 = lightProjectionMatrix;
        //Konec svojih matrik

        const { cameraUniformBuffer, cameraBindGroup } = this.prepareCamera(cameraComponent);
        this.device.queue.writeBuffer(cameraUniformBuffer, 0, viewMatrix);
        this.device.queue.writeBuffer(cameraUniformBuffer, 64, projectionMatrix);
        this.renderPass.setBindGroup(0, cameraBindGroup);

        const lightComponent = light.getComponentOfType(Light);
        const lightColor = vec3.scale(vec3.create(), lightComponent.color, 1 / 255);
        const lightDirection = vec3.normalize(vec3.create(), lightComponent.direction);
        //const lightIntensity = new Float32Array([lightComponent.intensity]);

        const { lightUniformBuffer2, lightBindGroup2 } = this.prepareLight(lightComponent, true);
        
        this.device.queue.writeBuffer(lightUniformBuffer2, 0, lightColor);
        this.device.queue.writeBuffer(lightUniformBuffer2, 16, lightDirection);
        //this.device.queue.writeBuffer(lightUniformBuffer, 32, lightIntensity);

        this.renderPass.setBindGroup(1, lightBindGroup2);

        this.renderNode(scene);
        //Konec poskusne kode

        this.renderPass.end();
        // this.device.queue.submit([this.encoder.finish()]);
    }
    

    render(scene, camera, light) {
        if (this.depthTexture.width !== this.canvas.width || this.depthTexture.height !== this.canvas.height) {
            this.recreateDepthTexture();
        }

        // const encoder = this.device.createCommandEncoder();
        this.renderPass = this.encoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this.context.getCurrentTexture().createView(),
                    clearValue: [0.835, 0.957, 1.0, 1.0],  //0.68, 0.85, 1.0, 1.0
                    loadOp: 'clear',
                    storeOp: 'store',
                }
            ],
            depthStencilAttachment: {
                view: this.depthTexture.createView(),
                depthClearValue: 1,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
                stencilClearValue: 0,
                stencilLoadOp: 'clear',
                stencilStoreOp: 'store',
            },
        });
        this.renderPass.setPipeline(this.perFragment ? this.pipelinePerFragment : this.pipelinePerVertex);

        const cameraComponent = camera.getComponentOfType(Camera);
        const viewMatrix = getGlobalViewMatrix(camera);
        const projectionMatrix = getProjectionMatrix(camera);
        const { cameraUniformBuffer, cameraBindGroup } = this.prepareCamera(cameraComponent);
        this.device.queue.writeBuffer(cameraUniformBuffer, 0, viewMatrix);
        this.device.queue.writeBuffer(cameraUniformBuffer, 64, projectionMatrix);
        this.renderPass.setBindGroup(0, cameraBindGroup);

        const lightComponent = light.getComponentOfType(Light);
        const lightColor = vec3.scale(vec3.create(), lightComponent.color, 1 / 255);
        const lightDirection = vec3.normalize(vec3.create(), lightComponent.direction);
        //const lightIntensity = new Float32Array([lightComponent.intensity]);

        const { sceneUniformBuffer, lightUniformBuffer, lightBindGroup } = this.prepareLight(lightComponent, false);
        this.device.queue.writeBuffer(lightUniformBuffer, 0, lightColor);
        this.device.queue.writeBuffer(lightUniformBuffer, 16, lightDirection);
        this.device.queue.writeBuffer(sceneUniformBuffer, 0, this.lightViewProjectionMatrix);   // To je za sence
        this.renderPass.setBindGroup(1, lightBindGroup);
        //this.device.queue.writeBuffer(lightUniformBuffer, 32, lightIntensity);

        // Ustvarimo bind group za sence
        //const { sceneUniformBuffer, shadowBindGroup } = this.prepareShadow();
        
        //this.renderPass.setBindGroup(4, shadowBindGroup);

        // BIND THE SHADOW MAP AND ITS SAMPLER TO THE GPU

        this.renderNode(scene);

        this.renderPass.end();
        this.device.queue.submit([this.encoder.finish()]);
    }

    renderNode(node, modelMatrix = mat4.create()) {
        const localMatrix = getLocalModelMatrix(node);
        modelMatrix = mat4.multiply(mat4.create(), modelMatrix, localMatrix);

        const { modelUniformBuffer, modelBindGroup } = this.prepareNode(node);
        const normalMatrix = this.mat3tomat4(mat3.normalFromMat4(mat3.create(), modelMatrix));
        this.device.queue.writeBuffer(modelUniformBuffer, 0, modelMatrix);
        this.device.queue.writeBuffer(modelUniformBuffer, 64, normalMatrix);
        this.renderPass.setBindGroup(2, modelBindGroup);

        for (const model of getModels(node)) {
            this.renderModel(model);
        }

        for (const child of node.children) {
            this.renderNode(child, modelMatrix);
        }
    }

    renderModel(model) {
        for (const primitive of model.primitives) {
            this.renderPrimitive(primitive);
        }
    }

    renderPrimitive(primitive) {
        const { materialUniformBuffer, materialBindGroup } = this.prepareMaterial(primitive.material);
        this.device.queue.writeBuffer(materialUniformBuffer, 0, new Float32Array(primitive.material.baseFactor));
        this.renderPass.setBindGroup(3, materialBindGroup);

        const { vertexBuffer, indexBuffer } = this.prepareMesh(primitive.mesh, vertexBufferLayout);
        this.renderPass.setVertexBuffer(0, vertexBuffer);
        this.renderPass.setIndexBuffer(indexBuffer, 'uint32');

        this.renderPass.drawIndexed(primitive.mesh.indices.length);
    }

}
