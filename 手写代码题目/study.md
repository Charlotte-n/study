# 营销页面搭建学习
## 组件是怎么管理的
通过美团内部的lancer组件管理工具来管理组件，通过它创建组件，删除组件，修改组件，然后可以引用到页面中使用。

lancer：
Lancer 是一款小程序页面的可视化搭建工具。
优势：
速度快：支持可视化搭建，即改即发。

成本低：研发仅需一次性开发组件。

小程序原生页面：可以使用小程序原生能力。

## 保存页面的时候

当保存页面的时候需要进行校验很多地方，拓展功能（ab测试、兜底配置、楼层打散配置），组件列表，通用页面列表都需要校验。

怎么实现的？

## 构建了组件树，来增加删除组件

```js
import { v4 as uuidv4 } from 'uuid';
import { cloneDeep } from 'lodash';
import { baseConfigWithoutCycleTime, baseConfigWithCycleTime } from './base-config';

export class Tree {
    /** 组件 id 与组件基本数据映射 */
    componentIdInfoMap = {};

    /** 组件 id 映射成可渲染表单项数据 Map */
    componentIdToFormMap = {};

    /** 用于渲染的 node 节点数据 */
    nodeList = [];

    constructor(allComponents, pageTree, isCopy, copyType) {
        allComponents.forEach((component) => {
            const componentId = component.componentId;
            const content = JSON.parse(component?.componentData);
            if (componentId && content) {
                const componentInfoWithBaseConfig = this.getComponentInfoWithBaseConfig(
                    content,
                    componentId
                );
                this.componentIdInfoMap[componentId] = componentInfoWithBaseConfig
                this.componentIdToFormMap[componentId] = this.parseComponentDataToFormItem(componentInfoWithBaseConfig);
            }
        });

        pageTree.forEach(node => {
            // 非复制直接回显
            if (!isCopy) {
                this.nodeList.push(node)
                return
            }
            // 普通复制剔除不可复制属性，重置为默认值
            if (Number(copyType) === 10) {
                const newNode = cloneDeep(node)
                newNode.nodeId = uuidv4()
                const componentId = newNode.componentId;
                const componentInfo = this.componentIdInfoMap[componentId]
                if (componentInfo) {
                    const componentInfoProps = componentInfo.props;
                    Object.keys(componentInfoProps).forEach(propKey => {
                        if (componentInfoProps[propKey].canCopy === false) {
                            newNode[propKey] = componentInfoProps[propKey].default
                        }
                    })
                    this.nodeList.push(newNode)
                }
            }

            // 完全复制只更新 nodeId，数据完全复用
            if (Number(copyType) === 20) {
                const newNode = cloneDeep(node)
                newNode.nodeId = uuidv4()
                this.nodeList.push(newNode)
            }
        })
    }

    getComponentInfoWithBaseConfig(componentData, componentId) {
        // 头图组件不允许分时段定义
        const isImage = componentId === 'image-header';
        componentData.props._baseConfig = isImage
            ? baseConfigWithoutCycleTime
            : baseConfigWithCycleTime;
        return componentData;
    }

    parseComponentDataToFormItem(componentData) {
        const extra = {};

        if (componentData?.extra?.appMiniVersion) {
            extra.appMiniVersion = componentData?.extra?.appMiniVersion;
        }

        return {
            componentId: componentData.id,
            componentName: componentData.name,
            props: this.getComponentProps(componentData.props),
            compHeight: componentData.compHeight || 0,
            extra,
        };
    }

    getComponentProps(componentProps) {
        const result = {};
        Object.keys(componentProps).forEach((key) => {
            // base config 独立配置 嵌套的结构应用默认值需要单独递归处理
            if (key === '_baseConfig' || key === 'customStyle' || key === 'skuAttributesConfig') {
                result[key] = this.getComponentProps(componentProps[key].items)
                return
            }
            if (typeof componentProps[key]?.default !== 'undefined') {
                result[key] = componentProps[key]?.default;
            } else {
                // TODO 根据 type 给系统默认值
                result[key] = undefined;
            }
        });
        return result;
    }

    addComponent(toAddComponentId) {
        const componentInfo = this.componentIdInfoMap[toAddComponentId];
        const formInfo = this.componentIdToFormMap[toAddComponentId];
        // 不存在当前添加的组件信息或表单映射关系，直接退出
        if (!componentInfo || !formInfo) {
            return;
        }
        const { numLimit = 1, conflictComponents = [] } = componentInfo;
        // 检查当前已添加的组件数量
        const currentFormComponents = this.nodeList.filter(
            (node) => node.componentId === toAddComponentId
        );
        // 如果某种组件数量超出限制，不添加组件
        if (currentFormComponents.length + 1 > numLimit) {
            return;
        }
        // 检查组件互斥关系
        let hasConflict = false;
        conflictComponents.forEach((conflictComponentId) => {
            if (this.nodeList.some((c) => c.componentId === conflictComponentId)) {
                hasConflict = true;
            }
        });
        // 如果有冲突，则不添加组件
        if (hasConflict) {
            return;
        }
        const toAddNode = cloneDeep(formInfo);
        const uuid = uuidv4();
        this.nodeList.push({
            ...toAddNode,
            nodeId: uuid,
        });
    }

    /**
     * @description 通过 Node id 删除节点
     * @param targetNodeId
     */
    deleteNodeById(targetNodeId) {
        const targetNodeIndex = this.nodeList.findIndex((node) => node.nodeId === targetNodeId);
        // 找到对应 Node，则删除
        if (targetNodeIndex > -1) {
            this.nodeList.splice(targetNodeIndex, 1);
        }
    }

    changeNodePosition(oldIndex, newIndex) {
        const delNode = this.nodeList.splice(oldIndex, 1)[0];
        this.nodeList.splice(newIndex, 0, delNode);
    }

    insertNode(index, node) {
        const newNode = {
            ...node,
            nodeId: uuidv4()
        }
        this.nodeList.splice(index, 0, newNode);
    }
}

```

## 怎么实现渲染组件的到app上面
认为是构建好了这个组件树，然后前端把这个组件树传递到后端，后端进行渲染组件树，然后返回给前端，前端进行渲染。


# 需求
## 生成海报和分享海报
### 生成海报
```vue
<template>
    <div>
        <el-dialog v-loading="loading" title="海报生成" :visible.sync="visible" :show-close="true" center style="width: 650px;margin:0 auto;">
            <el-form>
                <el-form-item label="选择投放网店">
                    <xx-poiselect
                        v-model="storeIdList"
                        :use-permission="true"
                        :poi-types="[4]"
                        :multiple="true"
                        row-value-key="poiId"
                    />
                </el-form-item>
            </el-form>
            <div class="btns">
                <el-button
                    @click="previewPoster"
                >
                    海报预览
                </el-button>
                <el-button
                    :disabled="isCreatePostersDisabled"
                    @click="generatePoster"
                >
                    一键生成
                </el-button>
            </div>
        </el-dialog>
        <image-viewer :img-array="imgArray" :current-index.sync="currentIndex" :show-modal="showPoster" @close="closeImgViewer"/>
        <posterListDialog
            ref="posterListDialog"
            :storeIdList="storeIdList"
            :isShowPosterListDialog.sync="isShowPosterListDialog"
            @updatePosterList="updatePosterList"
        />
    </div>
</template>

<script>
import posterListDialog from '../posterListDialog';
import qs from 'query-string';

const URL_PARAMS = qs.parse(window.location.search);
const PAGE_ID = URL_PARAMS.pageId;

export default ({
    components: {
        posterListDialog
    },
    props: {
        isShowCreatePosterDialog: Boolean
    },
    data(){
        return {
            storeIdList: [],
            hasPreviewPoster: false,
            isShowPosterListDialog: false,
            imgArray: [],
            currentIndex: 0,
            showPoster: false,
            loading: false
        }
    },
    computed: {
        isCreatePostersDisabled() {
            return !this.hasPreviewPoster;
        },
        visible: {
            get() {
                return this.isShowCreatePosterDialog;
            },
            set(v) {
                this.$emit('update:isShowCreatePosterDialog', v);
            }
        }
    },
    methods: {
        updatePosterList() {
            this.$emit('updatePosterList');
        },
        previewPoster() {
            if (!this.storeIdList.length) {
                this.$message({
                    type: 'error',
                    message: '请选择网店'
                });
                return
            }
            this.loading = true;
            this.$hPost('/api/m/mkt/ark/previewPoster', {
                pageId: PAGE_ID,
                storeIdList: this.storeIdList
            }).then(res => {
                this.loading = false;
                const posterUrl = res.pictureUrl || '';
                if (!posterUrl) {
                    this.$message.error('预览失败：图片url不存在')
                    return;
                }
                this.imgArray = [{
                    url: posterUrl,
                    index: 0
                }]
                this.showPoster = true;
                this.hasPreviewPoster = true;
            }).catch(err => {
                this.loading = false;
                this.$message.error('接口请求失败');
                console.log('poster preview failed', err);
            })
        },
        generatePoster() {
            this.isShowPosterListDialog = true;
            this.$refs.posterListDialog.generatePoster();
        },
        closeImgViewer() {
            this.showPoster = false;
        }
    },
})
</script>

<style scoped>
    .btns {
        position: relative;
        width:268px;
        display:flex;
        justify-content:space-between;
    }
</style>
```
posterListDialog组件,点击了一键生成之后会有这个列表
```vue
<template>
    <el-dialog title="海报列表" :visible.sync="visible" :show-close="true" center style="width: 1600px">
        <xx-table-pro
            v-loading="loading"
            :pagination="{ show: true, pageSize: pageSize }"
            :columns="columns"
            source="local"
            :local-data="localData"
            name="table"
        >
            <template slot="operations" slot-scope="scope">
                <el-button
                    type="text"
                    :disabled="failInGeneratePoster(scope)"
                    @click="previewPoster(scope)"
                >
                    预览
                </el-button>
                <el-button
                    type="text"
                    :disabled="failInGeneratePoster(scope)"
                    @click="downloadPoster(scope)"
                >
                    下载
                </el-button>
            </template>
        </xx-table-pro>
        <div slot="footer">
            <el-button @click="downloadAllPosters()">全量下载</el-button>
        </div>
        <image-viewer :img-array="imgArray" :current-index.sync="currentIndex" :show-modal="showPoster" @close="closeImgViewer"/> 
    </el-dialog>
</template>

<script>
import qs from 'query-string';
import { downloadImgPic, downloadImgList } from './pictureDownLoad';
const URL_PARAMS = qs.parse(window.location.search);
const PAGE_ID = URL_PARAMS.pageId;

export default ({
    props: {
        isShowPosterListDialog: Boolean,
        storeIdList: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            pageSize: 5, // 每页展示的数量
            columns: [
                {
                    prop: 'storeName',
                    label: '网店',
                    width: 200
                },
                {
                    prop: 'pictureUrl',
                    label: '海报图片URL',
                    width: 200
                },
                {
                    prop: 'state',
                    label: '生成状态',
                    width: 150
                },
                {
                    prop: 'operations',
                    label: '操作',
                    width: 200
                }
            ],
            posterUrlList: [],
            loading: false,
            localData: [],
            showPoster: false,
            imgArray: [],
            currentIndex: 0
        };
    },
    computed: {
        visible: {
            get() {
                return this.isShowPosterListDialog;
            },
            set(v) {
                this.$emit('update:isShowPosterListDialog', v);
            }
        }
    },
    mounted() {
        this.fetchPosterList();
    },
    methods: {
        async generatePoster() {
            try {
                this.loading = true;
                const posterList = await this.queryPosterList();
                this.localData = await this.responseDataHandling(posterList);
                this.loading = false;
                if (!this.localData?.length) {
                    this.$message.error('图片生成失败 返回图片列表为空');
                    return;
                }
                this.$emit('updatePosterList');
            } catch(e) {
                this.loading = false;
                this.$message.error('海报生成失败');
                console.log('poster generate faild', e)
            }
        },
        async queryPosterList() {
            return this.$hPost('/api/m/mkt/ark/generatePoster', {
                pageId: PAGE_ID,
                storeIdList: this.storeIdList
            }).then(res => res)
        },
        async getPoiInfoList(poiIdList) {
            return this.$hPost('/api/m/poiauth/PoiManageTService/getPoiListByPoiIdList', {
                poiIdList
            }).then(res => res)
        },
        async responseDataHandling(res) {
            const posterUrlList = res.pictureUrlList || [];
            if (!posterUrlList.length) {return};
            const storeIdList = posterUrlList.map(posterItem => {
                return posterItem.storeId;
            })
            const poiInfoList = await this.getPoiInfoList(storeIdList);
            const data = poiInfoList.map((poiInfo, index) => {
                const { status, pictureUrl } = posterUrlList[index];
                const state = status ? '成功' : '失败';
                const storeName = poiInfo.poiName;
                return {
                    storeName,
                    pictureUrl,
                    state
                }
            })
            this.posterUrlList = data;
            return data;
        },
        fetchPosterList() {
            this.$hGet('/api/m/mkt/ark/queryPosterByPageIdAndPageVersion', {
                pageId: PAGE_ID
            }).then(async res => {
                const data = await this.responseDataHandling(res);
                this.localData = data;
            })
        },
        previewPoster(e) {
            const posterUrl = e?.row?.pictureUrl || '';
            if (posterUrl) {
                this.imgArray = [
                    {
                        url: posterUrl,
                        index: 0
                    }
                ]
                this.showPoster = true
            };
        },
        downloadPoster(e) {
            const { pictureUrl, storeName } = e?.row;
            downloadImgPic({url: pictureUrl, fileName: storeName});
        },
        downloadAllPosters() {
            const imgList = this.posterUrlList.map(posterItem => {
                const {pictureUrl, storeName} = posterItem;
                return {
                    pictureUrl,
                    storeName
                }
            })
            downloadImgList(imgList).then(downloadResult => {
                const faildMsg = this.downloadImgListFailedHandle(downloadResult);
                if (!faildMsg) {return};
                this.$message.error(`${faildMsg}图片下载失败`);
            }) 
        },
        downloadImgListFailedHandle(result) {
            let faildMsg = '';
            result.forEach(resultItem => {
                if (!resultItem.downloadSuccess) {faildMsg+=resultItem.storeName}
            })
            return faildMsg;
        },
        closeImgViewer() {
            this.showPoster = false;
        },
        failInGeneratePoster(scope) {
            const { state } = scope?.row;
            return state !== '成功';
        }
    }
})
</script>

<style scoped>

</style>


```


是否生成海报要根据权限进行判断，创建了这个组件来判断是否有权限展示相关的内容
```vue
<template>
    <div class="compContainer" v-if="isShow" :biz="biz" :slotType="slotType">
        <slot></slot>
    </div>
</template>

<script>
import { getOperPermission } from 'utils/operationPermission'

export default {
    props: {
        biz: [Number, String],
        slotType: String,
    },
    data() {
        return {
            isShow: false
        }
    },
    async mounted() {
        this.isShow = await this.isShowComp();
    },
    methods: {
        async isShowComp() {
            const hasTypePer = await getOperPermission({type: this.slotType, biz: +this.biz});
            return hasTypePer;
        }
    }
}
</script>

<style scoped>
    .compContainer {
        display: inline;
    }
</style>
```
判断权限相关的方法
```js
import { getOperPerConfig } from './getOperPerConfig';

class OperationPermission {
    constructor() {
        this.operationPerConfig = {};
        this.initOperPerConfig();
    }
    async initOperPerConfig() {
        this.operationPerConfig = await getOperPerConfig();
    }
    getOperPermission(type, biz) {
        const types = Object.keys(this.operationPerConfig);
        if (!types.includes(type)) {return true};
        const typePer = this.operationPerConfig[type];
        const default_per = typePer.default;
        if (default_per) {
            const bizBlackList = typePer.blackList.map(bizItem => {
                return bizItem.biz;
            });
            return !bizBlackList.includes(biz);
        } else {
            const bizWhiteList = typePer.whiteList.map(bizItem => {
                return bizItem.biz;
            })
            return bizWhiteList.includes(biz);
        }
    }
}

const operationPer = new OperationPermission();

async function getOperPermission({type, biz}) {
    const keys = Object.keys(operationPer.operationPerConfig);
    if (!keys.length) {
        await operationPer.initOperPerConfig()
    }
    return operationPer.getOperPermission(type, biz);
}

export {
    getOperPermission
}

//获取权限配置
import { fetchPortal } from '@yxfe/tools';

export async function getOperPerConfig() {
    try {
        const currentEnv = process.env.NODE_ENV;
        const envName = currentEnv === 'production' ? 'prod' : 'test';
        const posterPerConfig = await fetchPortal('grocery-ark')('operationPermissionConfig') || {};
        return posterPerConfig[envName] || {};
    } catch (e) {
        console.error(`getOperPerConfig faild`, e);
    }
}
```

下载全部的海报
```js
import JSZip from 'jszip';
import FileSaver from 'file-saver';
 
export async function downloadImgList(imgList) {
    if (!Array.isArray(imgList) || !imgList.length) {return};
    const zip = new JSZip();
    const promises = imgList.map(imgItem => {
        const { pictureUrl, storeName } = imgItem;
        return new Promise((resolve) => {
            getUrlBase64(pictureUrl).then(urlBase64 => {
                // 去掉urlBase64里的描述部分
                zip.file(`${storeName}.png`, urlBase64.replace(/^data:image\/(png|jpg);base64,/, ""), {base64: true});
                resolve({downloadSuccess: true, storeName});
            }).catch(err => {
                console.log(`${storeName}:get urlBase64 faild`, err);
                // 避免一张图片下载失败影响其它图片下载 转base64失败时resolve出去
                resolve({downloadSuccess: false, storeName});
            })
        })
    })
    return Promise.all(promises).then(downloadResult => {
        zip.generateAsync({type:"blob"}).then(res => {
            FileSaver(res, "海报.zip");
        })
        return downloadResult;
    }).catch(err => {
        console.log('imgList download failed', err);
    })
}

export async function downloadImgPic({url, fileName}) {
    try {
        if (!url) {return}; 
        const urlBase64 = await getUrlBase64(url);
        const link = document.createElement("a");
        link.href = urlBase64;
        link.download = `${fileName}.png`;
        link.click();
    } catch(err) {
        console.error('图片下载失败', err)
    }
}
export async function getUrlBase64(imgUrl) {
    return new Promise((resolve, reject) => {
        let canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image(); 
        img.crossOrigin = "Anonymous";  //允许进行跨域
        img.src = imgUrl;
        img.onload = function() {
            canvas.height = img.height; //图片的高度
            canvas.width = img.width;//图片的宽度
            ctx.drawImage(img, 0, 0, img.width, img.height);
            const dataURL = canvas.toDataURL("image/png");
            canvas = null;
            resolve(dataURL);
        };
        img.onerror = function(err) {
            reject(err);
        }
    });
}
```


## 分时段背景色配置


## 保存配置


## 实时预览是怎么做的？
目前并没有进行实时预览，以前旧的版本中做了实时预览。


