## 分享配置
```vue
<template>
    <div>
        <div style="display: flex; align-items: center;">
            <el-tag v-if="shareData.shareConfigId" size="mini">{{value}}</el-tag>
            <el-button size="mini" v-else @click="showEditConfig()">分享配置</el-button>
            <template v-if="shareData.shareConfigId">
                <div v-if="preview">
                    <div style="margin-left: 5px; color: #4187ff;cursor: pointer;" @click="showEditConfig()">点击查看分享配置</div>
                </div>
                <div v-else>
                    <el-button size="mini" style="margin-left: 5px;" @click="showEditConfig()">修改分享配置</el-button>
                    <i class="el-icon-delete" style="margin-left: 5px;line-height: 32px;" @click="clearShare()"></i>
                </div>
            </template>
        </div>
        <el-dialog
            title="分享配置"
            :visible.sync="dialogVisible"
            width="60%"
            :show-close="preview"
            append-to-body
            modal-append-to-body>
            <div style="display: flex; max-height: 610px; overflow-y: scroll; margin: 0 20px;">
                <div v-if="shareData.templateId === null">
                    <h4 class="row-header">选择分享配置模版</h4>
                    <xx-table-pro
                        name="mainTable"
                        ref="mainTable"
                        :buildParams="buildParams"
                        :responseProcessor="responseProcessor"
                        :ajax="getDataOpt()"
                        :columns="columns">
                        <template prop="ops" slot="ops" slot-scope="scope">
                            <el-button type="text" size="mini" @click="selectTemplate(scope.row)">选择</el-button>
                        </template>
                    </xx-table-pro>
                </div>
                <xx-submit-form
                    v-else
                    ref="editForm"
                    status-icon
                    label-width="120px"
                    :disabled="preview"
                    :model="shareData">
                    <el-row>
                        <div style="display: flex; justify-content: flex-end;">
                            <el-button size="mini" icon="el-icon-refresh-right" @click="reselectTemplate">重新选择模版</el-button>
                        </div>
                        <h4 class="row-header">渠道配置</h4>
                        <el-radio-group v-model="shareData.differChannelSwitch" @change="changeChannel">
                            <el-radio :label="false">不分渠道</el-radio>
                            <el-radio :label="true">分渠道</el-radio>
                        </el-radio-group>
                        <div v-if="shareData.differChannelSwitch" class="channel-info">
                            <el-row v-for="item in shareData.differChannelConfig" :key="item.channel" style="margin: 8px;">
                                <el-col :span="4">{{ getChannelName(item.channel) }}</el-col>
                                <el-checkbox-group v-model="item.supportShareTypes" @change="handleCheckedChannelsChange">
                                    <el-checkbox v-for="shareItem in shareData.shareConfigs" :key="shareItem.type" :label="shareItem.type" :disabled="checkChannelDisabled(item, shareItem)">{{ getShareChannelName(shareItem.type) }}</el-checkbox>
                                </el-checkbox-group>
                            </el-row>
                        </div>
                        <br />
                        <h4 class="row-header">内容配置</h4>
                        <div style="display: flex; flex-direction: column;">
                            <el-col v-for="(item, index) in shareData.shareConfigs" :key="index" :name="index + ''">
                                <template v-if="(item.extAttributes || {}).isOptional">
                                    <el-checkbox :checked="checked(item.type)" @change="(checked) => shareChecked(checked, item.type)"><h4>{{ getShareChannelName(item.type) }}</h4></el-checkbox>
                                    <shareItem v-if="checked(item.type)" :type="item.type" :item="item" :index="index" :disabled="preview" />
                                </template>
                                <template v-else>
                                    <h4>{{ getShareChannelName(item.type) }}</h4>
                                    <shareItem :type="item.type" :item="item" :index="index" :disabled="preview" />
                                </template>
                            </el-col>
                        </div>
                        <br />
                        <template v-if="curBackupConfigs && curBackupConfigs.length > 0 && curBackupConfigs[0].type">
                            <h4 class="row-header">备选配置</h4>
                            <div style="padding: 0 0 20px 10px">当以上分享形式超额或异常不可分享时，默认分享海报形式，保证线上分享流程正常使用，请上传海报背景图</div>
                            <shareItem :type="curBackupConfigs[0].type" :item="curBackupConfigs[0]" :disabled="preview" />
                        </template>
                    </el-row>
                </xx-submit-form>
            </div>
            <span v-if="!preview" slot="footer" class="dialog-footer">
                <el-button size="medium" @click="handleCancel">取 消</el-button>
                <el-button size="medium" type="primary" @click="submitForm">保 存</el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>
import request from 'request/plus';
import shareItem from './item/index';
import { getShareChannelName, getChannelName, SHARE_TYPE } from './utils';

const templateService = new (request('/grocery/interact/sharecenter/template'))();
const shareService = new (request('/grocery/interact/sharecenter/instance'))();

const differChannelConfigs = {
    differChannelSwitch: false,
    differChannelConfig: [{
        channel: 1,
        supportShareTypes: [1, 2, 3, 4, 5, 6, 7],
    },
    {
        channel: 2,
        supportShareTypes: [1, 3, 4, 6, 7],
    },
    {
        channel: 3,
        supportShareTypes: [1, 2, 3, 4, 5, 6, 7],
    },
    {
        channel: 4,
        supportShareTypes: [1, 3, 4, 6, 7],
    }],
};

export default {
    props: {
        value: {
            type: [Number, String],
            default: null,
        },
        scene: {
            type: [Number, String],
        },
        preview: {
            type: Boolean,
            default: false,
        },
        copy: {
            type: Boolean,
            default: false,
        },
    },
    components: {
        shareItem,
    },
    data() {
        return {
            dialogVisible: false,
            shareData: {
                templateId: null,
                shareConfigId: null,
                shareConfigs: [],
                backupMaterialConfigs: [],
                ...differChannelConfigs,
            },
            templateList: [],
            columns: [
                { prop: 'templateId', label: '分享模版ID' },
                { prop: 'name', label: '模版名称' },
                { prop: 'ops', label: '操作', fixed: 'right' },
            ],
            curShareConfigs: [],
            curBackupConfigs: [],
            sortTypes: [],
            checkedChannels: ['微信小程序', '美团App', '优选App', '美团小程序'],
        };
    },
    computed: {
        show() {
            return this.dialogVisible || this.preview;
        },
    },
    watch: {
        value: {
            handler(val) {
                if (this.copy && val && !this.shareData.shareConfigId) {
                    this.copyConfig(this.value).then((res) => {
                        if (res) {
                            this.shareData.shareConfigId = res;
                            this.$emit('input', res);
                        }
                    });
                } else {
                    this.shareData.shareConfigId = val;
                }
            },
            immediate: true,
        },
    },
    created() {
        if (!this.scene) {
            console.error('分享组件，场景scene不能为空');
        }
    },
    methods: {
        getShareChannelName,
        getChannelName,
        handleCancel() {
            this.dialogVisible = false;
        },
        changeChannel(e) {
            if (e) {
                this.shareData.differChannelConfig = JSON.parse(JSON.stringify(differChannelConfigs.differChannelConfig));
            } else {
                this.shareData.differChannelConfig = [];
            }
        },
        // 控制当前渠道下的分享类型是否可勾选使用
        checkChannelDisabled(item, shareitem) {
            return (item.channel === 2 || item.channel === 4) && (shareitem.type === 2 || shareitem.type === 5);
        },
        handleCheckedChannelsChange() {},
        clearShare() {
            this.curShareConfigs = [];
            this.curBackupConfigs = [],
            this.shareData = {
                templateId: null,
                shareConfigId: null,
                shareConfigs: [],
                backupMaterialConfigs: [],
                ...differChannelConfigs,
            };
            this.$emit('input', null);
        },
        async submitForm(event, isConfirm = false) {
            try {
                await this.$refs['editForm'].validate();
            } catch (error) {
                this.$message({
                    type: 'error',
                    message: '请更改错误信息',
                });
                return;
            }

            if (this.curShareConfigs.length === 0) {
                this.$message({
                    type: 'error',
                    message: '至少需要选择一个分享形式',
                });
                return;
            }

            this.saveConfigDetail(isConfirm)
                .then(data => {
                    if (data) {
                        this.$message({
                            type: 'success',
                            message: data.msg || data.message || '分享配置保存成功',
                        });
                        this.shareData.shareConfigId = data.shareConfigId;
                        this.$emit('input', data.shareConfigId);
                        this.dialogVisible = false;
                    }
                })
                .catch(e => {
                    if (e.code === 2001) {
                        this.$confirm(e.msg || e.message, {
                            confirmButtonText: '继续保存',
                            cancelButtonText: '取消',
                            type: 'warning'
                        }).then(async () => {
                            await this.submitForm(event, true);
                        }).catch(() => {
                            this.$message({
                                type: 'error',
                                message: e.msg || e.message || '查询失败，请稍后重试',
                            });          
                        });
                    } else {
                        this.$message({
                            type: 'error',
                            message: e.msg || e.message || '查询失败，请稍后重试',
                        });
                    }
                });
        },
        async fetchConfigDetail(shareConfigId) {
            this.shareData.shareConfigs = [];

            try {
                const data = await shareService.get('/queryDetail', { shareConfigId });
                if (data) {
                    this.curShareConfigs = this.parseShareConfigs(data.shareConfigs);
                    this.curBackupConfigs = this.parseShareConfigs(data.backupMaterialConfigs);
                    data.shareConfigs.length = 0;
                    this.shareData = { ...differChannelConfigs, ...data };
                    this.fetchTemplateDetail(data.templateId);
                }
            } catch (e) {
                this.$message({
                    type: 'error',
                    message: e.msg || e.message || '查询失败，请稍后重试',
                });
            }
        },
        async fetchTemplateList() {
            try {
                const data = await templateService.post('/list', { offset: 1, limit: 10 });
                if (data && data.shareTemplates) {
                    this.templateList = data.shareTemplates;
                }
            } catch (e) {
                this.$message({
                    type: 'error',
                    message: e.msg || e.message || '查询失败，请稍后重试',
                });
            }
        },
        genPosterBackupConfig(shareConfigs, extAttr) {
            if (!this.curBackupConfigs || this.curBackupConfigs.length === 0) {
                const extAttributes = JSON.parse(extAttr);
                // url尝试从模板内取，若取不到尝试从模板第一个分享类型里取
                let url = extAttributes.url;
                if (!url) {
                    url = shareConfigs[0].url;
                }
                this.curBackupConfigs =[{
                    type: SHARE_TYPE.poster,
                    titles: [''],
                    extAttributes: {
                        posterId: 34,
                        popBg: 'https://img.meituan.net/groceryimages/d605025732d28b459056d30fd124113380137.png'
                    },
                    url
                }]
            }
        },
        async fetchTemplateDetail(templateId) {
            try {
                const data = await templateService.get('/detail', { templateId });
                if (data) {
                    let shareConfigs = JSON.parse(data.defaultShareConfig);

                    this.sortTypes = shareConfigs.map(item => item.type);
                    if (this.curShareConfigs.length === 0) {
                        this.shareData.shareConfigs = shareConfigs;
                        this.curShareConfigs = JSON.parse(JSON.stringify(shareConfigs));
                    } else {
                        shareConfigs = shareConfigs.map(item => {
                            const config = this.curShareConfigs.find(curItem => curItem.type === item.type);
                            return config || item;
                        });

                        this.shareData.shareConfigs = shareConfigs;
                    }
                    // 若实例接口没有备用分享配置，构造一个默认的海报
                    this.genPosterBackupConfig(shareConfigs, data.extAttributes);
                }
            } catch (e) {
                this.$message({
                    type: 'error',
                    message: e.msg || e.message || '查询失败，请稍后重试',
                });
            }
        },
        async saveConfigDetail(isConfirm = false) {
            const shareConfigs = this.curShareConfigs.map((curItem) => JSON.parse(JSON.stringify(this.shareData.shareConfigs.find((item) => curItem.type === item.type))));

            for (let i = 0; i < shareConfigs.length; i++) {
                shareConfigs.forEach((item) => {
                    const ext = item.extAttributes;
                    if (typeof ext === 'object') {
                        delete item.extAttributes;
                        item.extAttributes = JSON.stringify(ext);
                    }
                });
            }
            let newDifferChannelConfig = [];
            if (this.shareData.differChannelSwitch) {
                newDifferChannelConfig = this.shareData.differChannelConfig.map((item) => {
                    const lll = item.supportShareTypes.filter((i) => this.shareData.shareConfigs.find((ei) => ei.type === i));
                    if (lll.length === 0) {
                        throw new Error('渠道分享类型不可以为空，请检查后重新保存');
                    }
                    return {
                        ...item,
                        supportShareTypes: lll,
                    };
                });
            }
            const backupMaterialConfigs = [];
            if (!isConfirm) {
                for (let i = 0; i < this.curBackupConfigs.length; i++) {
                    this.curBackupConfigs.forEach((el) => {
                        // 如果没有确认，且没有上传海报图，则检查是否需要提示
                        if (!isConfirm && !el.imageUrl) {
                            let showConfimDialog = false;
                            // 若分享配置本就少于等于1个，直接提示
                            if (shareConfigs.length <= 1) {
                                if (shareConfigs[0] && shareConfigs[0].type === SHARE_TYPE.poster) {
                                    showConfimDialog = false;
                                } else {
                                    showConfimDialog = true;
                                }
                            } else if (newDifferChannelConfig && newDifferChannelConfig.length > 0) {
                                // 若分享配置本就少于等于1个，直接提示
                                const channelInfo = newDifferChannelConfig.find(item => item.supportShareTypes.length <= 1);
                                if (channelInfo) {
                                    if (channelInfo.supportShareTypes.includes(SHARE_TYPE.poster)) {
                                        showConfimDialog = false;
                                    } else {
                                        showConfimDialog = true;
                                    }
                                }
                            }
                            if (showConfimDialog) {
                                // eslint-disable-next-line no-throw-literal
                                throw {
                                    message: '当系统异常或资源超额后，可导致用户无法分享，建议增加备选配置',
                                    code: 2001
                                };
                            }
                        }
                        const item = this.$tools.deepClone(el); 
                        const ext = item.extAttributes;
                        if (typeof ext === 'object') {
                            delete item.extAttributes;
                            item.extAttributes = JSON.stringify(ext);
                        }
                        backupMaterialConfigs.push(item);
                    });
                }
            }
            
            const data = await shareService.post('/save', {
                ...this.shareData,
                shareConfigs,
                backupMaterialConfigs,
                differChannelConfig: newDifferChannelConfig,
            });
            return data;
        },
        selectTemplate(item) {
            this.shareData.templateId = item.templateId;
            this.fetchTemplateDetail(item.templateId);
        },
        reselectTemplate() {
            this.shareData.templateId = null;
            this.shareData.shareConfigs = [];
            this.shareData.differChannelSwitch = false;
            this.shareData.differChannelConfig = JSON.parse(JSON.stringify(differChannelConfigs.differChannelConfig));
            this.curShareConfigs = [];
        },
        showEditConfig() {
            if (!this.scene) {
                this.$message({
                    type: 'error',
                    message: 'scene不能为空，请更新后重试',
                });

                return;
            }
            this.dialogVisible = true;
            if (this.value) {
                this.shareData.shareConfigId = this.value;
                this.fetchConfigDetail(this.value);
            } else {
                this.shareData.shareConfigId = null;
            }
        },
        // list
        getDataOpt() {
            return {
                promiseFn: (params) => templateService.post('/list', params, {}),
                params: {
                    ...this.condition,
                },
            };
        },
        buildParams(params, tableParams) {
            return {
                ...params,
                shareScene: this.scene,
                page: {
                    offset: tableParams.paging.offset,
                    limit: tableParams.paging.limit
                }
            }
        },
        responseProcessor(res) {
            const list = res.shareTemplates || [];
            return {
                data: list,
                total: res.total,
            };
        },
        parseShareConfigs(data) {
            return (data || []).map((item = {}) => {
                if (item.extAttributes) {
                    item.extAttributes = JSON.parse(item.extAttributes);
                } else {
                    item.extAttributes = {};
                }

                return item;
            });
        },
        checked(shareType) {
            return !!this.curShareConfigs.find(item => item.type === shareType);
        },
        shareChecked(checked, shareType) {
            if (checked) {
                this.curShareConfigs.push(this.shareData.shareConfigs.find(item => item.type === shareType));
                this.curShareConfigs.sort((a, b) => {
                    return this.sortTypes.indexOf(a) - this.sortTypes.indexOf(b);
                });
            } else {
                this.curShareConfigs = this.curShareConfigs.filter(item => item.type !== shareType);
            }
        },
        getShareConfig(type) {
            return this.curShareConfigs.find(item => item.type === type);
        },
        async copyConfig(shareConfigId) {
            try {
                const data = await shareService.get('/copy', { shareConfigId });
                return data;
            } catch (e) {
                this.$message({
                    type: 'error',
                    message: e.msg || e.message || '查询失败，请稍后重试',
                });
            }
            return null;
        },
    },
};
</script>

<style scoped lang="scss" rel="stylesheet/scss">
.inline-input-warp /deep/ .el-input {
    width: 260px;
}
.special-pick-form {
    margin-top: 20px;
    .special-input-warp /deep/ .el-input {
        width: 180px;
    }
}
.is-without-controls.el-input-number {
    margin-right: -30px;
}
.preview-card {
    width: 250px;
    height: 160px;
}
.item-card {
    margin-top: 20px;
    border-bottom: gray solid 1px;
}
.add-btn {
    width: 190px;
    height: 78px;
    margin: 25px;
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    font-size: 28px;
    color: #8c939d;
    line-height: 78px;
    text-align: center;
}
.add-btn-wrap {
    display: flex;
    justify-content: center;
}
.template-text {
    width: 260px;
    border-radius: 5px;
    border: 1px solid #d9d9d9;
    margin: 10px;
    padding: 10px 20px;
    cursor: pointer;
    .info {
        display: flex;
        flex-direction: column;
        align-items: baseline;
        .name {
            font-size: 20px;
        }
        .id {
             font-size: 12px;
             color: #636161;
        }
    }
}
.el-checkbox {
    margin-right: 0px;
}

.channel-info {
    background: #F5F6F7;
    border-radius: 5px;
    padding: 2px 5px;
    margin: 5px;
}
</style>

```

备选配置poster
```vue
<template>
    <div class="card-template">
        <div>
            <el-card class="preview-card" :body-style="{ padding: '0px 0px 8px 0px' }">
                <xx-image v-if="previewPic" :src="previewPic" fit="contain" class="preview-image"></xx-image>
            </el-card>
        </div>
        <div class="card-template-info">
            <el-form-item label="海报模板Id" :rules="formRules.posterId" :prop="posterId">
                <el-input v-model="item.extAttributes.posterId" class="opreate-input" :disabled="!isTemplate || disabled" />
                <span v-if="isTemplate" class="postId" @click="gotoPoster">查询海报模板Id</span>
            </el-form-item>
            <el-form-item label="海报背景图" :rules="rules.imageUrl">
                <image-upload v-model="item.imageUrl" mode="single" :validate-rule="imgValidateRule" :disabled="disabled"></image-upload>
                <span class="image-demand">生成海报的背景图，图片大小不超过1M，支持格式jpg/png/jpeg</span>
            </el-form-item>
            <el-form-item label="海报弹窗图" :rules="rules.popBg" :prop="popBg">
                <image-upload
                    v-model="item.extAttributes.popBg"
                    mode="single"
                    :validate-rule="popBgValidateRule"
                    :disabled="disabled"
                ></image-upload>
                <span class="image-demand">在C端弹窗展示出来的示例图，图片大小不超过1M，支持格式jpg/png/jpeg</span>
            </el-form-item>
            <template v-if="isTemplate">
                <!-- <el-form-item label="分享路径" :rules="formRules.url" :prop="propPath">
                    <path-picker v-model="item.url" :disabled="disabled" :shareScene="shareScene" :type="type" mode="share" />
                </el-form-item> -->
                <shareBtnConfig :item="item" />
            </template>
            <!-- <span class="image-demand">
                海报绘制模版配置，
                <a herf="https://km.sankuai.com/page/922459183">点击查看</a>
            </span> -->
        </div>
    </div>
</template>

<script>
import throttle from 'lodash/throttle';
import ImageUpload from 'projects/promotion-base/src/components/image-upload/image-upload.vue';
import { queryTemplateDetail } from '../utils';
import base from './base';

const imgValidateRule = {
    maxSize: 1024,
    picFormat: ['png', 'jpg', 'jpeg'],
};

const popBgValidateRule = {
    maxSize: 1024,
    picFormat: ['png', 'jpg', 'jpeg'],
};

const rules = {
    imageUrl: [
        {
            required: true,
        }
    ],
    popBg: [
        {
            required: true,
            validator: (r, v, cb) => {
                if (!v.extAttributes.popBg) {
                    cb(new Error('海报背景图不能为空'));
                } else {
                    cb();
                }
            },
            trigger: ['blur', 'change'],
        },
    ],
};

export default {
    components: {
        ImageUpload,
    },
    extends: base,
    props: {
        shareScene: {
            type: Number,
        },
        type: {
            type: Number,
        },
    },
    data() {
        return {
            previewPic: '',
            imgValidateRule,
            popBgValidateRule,
            rules,
        };
    },
    watch: {
        'item.extAttributes.posterId': {
            handler: function (val) {
                throttle(async () => {
                    if (val) {
                        const posterPreview = await queryTemplateDetail({ drawTemplateId: +val });
                        this.previewPic = posterPreview ? posterPreview.previewPic : '';
                    }
                }, 1000)(val);
            },
            immediate: true,
        },
    },
    mounted() {
        this.item.extAttributes.popBg = this.item.extAttributes.popBg || 'https://img.meituan.net/groceryimages/d605025732d28b459056d30fd124113380137.png'
    },
    methods: {
        gotoPoster() {
            this.$tools.linkTo('/promotion/drawingManager/templateManager/list.html', '', { target: '_blank' });
        },
    },
};
</script>

<style scoped lang="scss" rel="stylesheet/scss">
.card-template {
    display: flex;
    border-bottom: solid #efefef 1px;
    &-info {
        margin-left: 10px;
    }
}
.pwtext {
    max-width: 300px;
    margin: 10px 15px;
}
.preview-card {
    width: 250px;
    min-height: 250px;
    margin: 5px 10px 10px 10px;
    .preview-image {
        width: 248px;
        height: 248px;
    }
    .logo {
        margin-left: 10px;
        display: flex;
        align-items: center;
        font-size: 13px;
        color: #999999;
        line-height: 22px;
    }
    .logo-icon {
        width: 20px;
        height: 20px;
        margin-right: 5px;
    }
    .title {
        font-size: 14px;
        font-weight: bold;
        padding: 5px 10px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
    .btn {
        width: 220px;
        line-height: 34px;
        background: #ffd100;
        text-align: center;
        font-size: 14px;
        font-weight: bold;
        border-radius: 8px;
        margin: 5px auto;
    }
}
.image-demand {
    display: inline-block;
    color: #9aa9bf;
    left: 260px;
    font-size: 12px;
    line-height: 20px;
}
.title-input-wrap {
    display: flex;
    align-items: center;
    .opreate-input {
        width: 300px;
    }
    .operate-icon {
        margin-left: 10px;
    }
}

.postId {
    color: #4187ff;
    cursor: pointer;
}
</style>

```
小程序卡片
```vue
<template>
    <div class="card-template">
        <el-card class="preview-card" :body-style="{ padding: '10px 10px 0 10px' }">
            <div class="logo">
                <img src="https://p0.meituan.net/travelcube/830874b89a254e47dd39a97c7c9c914a3744.jpg" class="logo-icon" />
                <div>美团优选 果蔬内禽蛋日用百货</div>
            </div>
            <div class="title">{{ item.titles[0] }}</div>
            <xx-image
                :src="item.imageUrl || 'https://p1.meituan.net/travelcube/83e12caec292d279dd182e42e1be65d212623.png'"
                fit="cover"
                class="preview-image"
            ></xx-image>
            <div class="logo" style="border-top: 1px #eeeeee solid">
                <img src="https://p1.meituan.net/travelcube/3e81788b86c343686c1523c4ed7d184b980.png" class="logo-icon-bottom" />
                <div>小程序</div>
            </div>
        </el-card>
        <div class="card-template-info">
            <el-form-item label="分享标题" :rules="formRules.titles" :prop="propPath">
                <div v-for="(titleitem, index) in item.titles" :key="index" class="title-input-wrap">
                    <el-input v-model="item.titles[index]" :maxlength="30" class="opreate-input" :disabled="disabled"></el-input>
                    <i v-if="!disabled && item.titles.length > 1" class="el-icon-delete operate-icon" @click="removeTitleItem(index)"></i>
                    <i v-if="!disabled && index === item.titles.length - 1" class="el-icon-plus operate-icon" @click="addTitleItem"></i>
                </div>
            </el-form-item>
            <el-form-item label="分享图片" :rules="formRules.imageUrl" :prop="propPath">
                <image-upload v-model="item.imageUrl" mode="single" :validate-rule="imgValidateRule" :disabled="disabled"></image-upload>
                <span class="image-demand">图片宽度不高于750且不低于320，图片大小不超过512KB，支持格式jpg/png/jpeg</span>
            </el-form-item>
            <template v-if="isTemplate">
                <!-- <el-form-item label="分享路径" :rules="formRules.url" :prop="propPath">
                    <path-picker v-model="item.url" :disabled="disabled" :shareScene="shareScene" :type="type" mode="share" />
                </el-form-item> -->
                <shareBtnConfig :item="item" />
            </template>
        </div>
    </div>
</template>
<script>
import ImageUpload from 'projects/promotion-base/src/components/image-upload/image-upload.vue';
import base from './base';

const imgValidateRule = {
    maxWidth: 750,
    minWidth: 320,
    maxSize: 512,
    picFormat: ['png', 'jpg', 'jpeg'],
};

export default {
    components: {
        ImageUpload,
    },
    extends: base,
    props: {
        shareScene: {
            type: Number,
        },
        type: {
            type: Number,
        },
    },
    data: function () {
        return {
            imgValidateRule,
        };
    },
    methods: {
        addTitleItem() {
            this.item.titles.push('');
        },
        removeTitleItem(index) {
            this.item.titles.splice(index, 1);
        },
    },
};
</script>

<style scoped lang="scss" rel="stylesheet/scss">
.card-template {
    display: flex;
    padding-bottom: 20px;
    border-bottom: solid #efefef 1px;
    &-info {
        margin-left: 10px;
    }
}
.preview-card {
    width: 250px;
    height: fit-content;
    margin: 15px;
    .title {
        font-size: 14px;
        margin: 5px 0;
    }
    .logo {
        display: flex;
        align-items: center;
        font-size: 13px;
        color: #999999;
        line-height: 22px;
    }
    .bottom {
        display: flex;
        align-items: center;
        font-size: 10px;
    }
}
.logo-icon {
    width: 20px;
    height: 20px;
    margin-right: 5px;
}
.logo-icon-bottom {
    width: 12px;
    height: 12px;
    margin-right: 5px;
}
.preview-image {
    width: 100%;
    height: 170px;
    margin-top: 5px;
}
.image-demand {
    display: inline-block;
    color: #9aa9bf;
    left: 260px;
    font-size: 12px;
    line-height: 20px;
}
.title-input-wrap {
    display: flex;
    align-items: center;
    .opreate-input {
        width: 300px;
    }
    .operate-icon {
        margin-left: 10px;
    }
}
</style>

```
短链卡片
```vue
<template>
    <div class="card-template">
        <div>
            <div class="image-demand">短链分享格式：</div>
            <div class="pwtext">{{ item.titles[0] }}<div style="color: #4187ff">#小程序://美团优选果蔬肉禽蛋日用百货/{{ item.text }}/y15xFycBjiFTjyl</div></div>
        </div>
        <div class="card-template-info">
            <el-form-item label="分享标题" :rules="formRules.titles" :prop="propPath">
                <div v-for="(titleitem, index) in item.titles" v-bind:key="index" class="title-input-wrap">
                    <el-input v-model="item.titles[index]" :maxlength="20" class="opreate-input" :disabled="disabled" />
                    <i v-if="!disabled && item.titles.length > 1" class="el-icon-delete operate-icon" @click="removeTitleItem(index)"></i>
                    <i v-if="!disabled && index === item.titles.length - 1" class="el-icon-plus operate-icon" @click="addTitleItem"></i>
                </div>
            </el-form-item>
            <el-form-item label="分享内容" :rules="formRules.text" :prop="propPath">
                <el-input v-model="item.text" :maxlength="6" :disabled="disabled" />
            </el-form-item>
            <template v-if="isTemplate">
                <!-- <el-form-item label="分享路径" :rules="formRules.url" :prop="propPath">
                    <path-picker v-model="item.url" :disabled="disabled" :shareScene="shareScene" :type="type" mode="share" />
                </el-form-item> -->
                <shareBtnConfig :item="item" />
            </template>
        </div>
    </div>
</template>

<script>
import base from './base';

export default {
    extends: base,
    components: {
    },
    props: {
        shareScene: {
            type: Number,
        },
        type: {
            type: Number,
        },
    },
    methods: {
        addTitleItem() {
            this.item.titles.push('');
        },
        removeTitleItem(index) {
            this.item.titles.splice(index, 1);
        },
    },
};
</script>

<style scoped lang="scss" rel="stylesheet/scss">
.card-template {
    display: flex;
    border-bottom: solid #efefef 1px;
    &-info {
        margin-left: 10px;
    }
}
.pwtext {
    max-width: 300px;
    margin: 10px 15px;
}
.preview-card {
    width: 250px;
    margin: 5px 10px 10px 10px;
    .title {
        font-size: 14px;
        font-weight: bold;
        padding: 5px 10px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
    .btn {
        width: 220px;
        line-height: 34px;
        background: #ffd100;
        text-align: center;
        font-size: 14px;
        font-weight: bold;
        border-radius: 8px;
        margin: 5px auto;
    }
}
.image-demand {
    display: inline-block;
    color: #9aa9bf;
    left: 260px;
    font-size: 12px;
    line-height: 20px;
}
.title-input-wrap {
    display: flex;
    align-items: center;
    .opreate-input {
        width: 300px;
    }
    .operate-icon {
        margin-left: 10px;
    }
}
</style>

```

h5卡片
```vue
<template>
    <div class="card-template">
        <el-card class="preview-card" :body-style="{ padding: '10px 10px 0 10px' }">
            <div>
                <div class="title">{{ item.titles[0] || '' }}</div>
                <div class="preview-info">
                    <div class="content">{{ item.text }}</div>
                    <xx-image
                        :src="item.imageUrl || 'https://p0.meituan.net/travelcube/e4d044eca70dce7c6bc7458accbaaa6b13242.png'"
                        class="preview-image"
                    ></xx-image>
                </div>
                <div class="logo" style="border-top: 1px #eeeeee solid">
                    <img src="https://p0.meituan.net/travelcube/830874b89a254e47dd39a97c7c9c914a3744.jpg" class="logo-icon-bottom" />
                    <div>美团优选</div>
                </div>
            </div>
        </el-card>
        <div class="card-template-info">
            <el-form-item label="分享标题" :rules="formRules.titles" :prop="propPath">
                <div v-for="(titleitem, index) in item.titles" :key="index" class="title-input-wrap">
                    <el-input v-model="item.titles[index]" :maxlength="30" class="opreate-input" :disabled="disabled"></el-input>
                    <i v-if="!disabled && item.titles.length > 1" class="el-icon-delete operate-icon" @click="removeTitleItem(index)"></i>
                    <i v-if="!disabled && index === item.titles.length - 1" class="el-icon-plus operate-icon" @click="addTitleItem"></i>
                </div>
            </el-form-item>
            <el-form-item label="分享内容" :rules="formRules.text" :prop="propPath">
                <el-input v-model="item.text" :maxlength="30" :disabled="disabled"></el-input>
            </el-form-item>
            <el-form-item label="分享图片" :rules="formRules.imageUrl" :prop="propPath">
                <image-upload v-model="item.imageUrl" mode="single" :validate-rule="imgValidateRule" :disabled="disabled"></image-upload>
                <span class="image-demand">图片大小不高于96*96且不低于48*48，图片大小不超过128KB，支持格式jpg/png/jpeg</span>
            </el-form-item>
            <template v-if="isTemplate">
                <!-- <el-form-item :rules="formRules.url" :prop="propPath" label="分享路径">
                    <path-picker v-model="item.url" :disabled="disabled" :shareScene="shareScene" :type="type" mode="share" />
                </el-form-item> -->
                <el-form-item label="落地页背景" prop="imgCode">
                    <el-input v-model="item.extAttributes.imgCode" :maxlength="-1" :disabled="disabled"></el-input>
                </el-form-item>
                <shareBtnConfig :item="item" />
            </template>
            <!-- <el-form-item v-if="isTemplate" label="分享路径" prop="backFlowChannel">
                <el-radio-group v-model="item.backFlowChannel" size="small">
                    <el-radio-button label="1">优选App</el-radio-button>
                    <el-radio-button label="2">优选微信小程序</el-radio-button>
                    <el-radio-button label="3">美团App</el-radio-button>
                    <el-radio-button label="4">美团微信小程序</el-radio-button>
                </el-radio-group>
            </el-form-item> -->
        </div>
    </div>
</template>

<script>
import ImageUpload from 'projects/promotion-base/src/components/image-upload/image-upload.vue';
import base from './base';

const imgValidateRule = {
    maxWidth: 96,
    maxHeight: 96,
    minWidth: 48,
    minHeight: 48,
    maxSize: 128,
    picFormat: ['png', 'jpg', 'jpeg'],
};

export default {
    components: {
        ImageUpload,
    },
    extends: base,
    props: {
        shareScene: {
            type: Number,
        },
        type: {
            type: Number,
        },
    },
    data() {
        return {
            imgValidateRule,
        };
    },
    methods: {
        addTitleItem() {
            this.item.titles.push('');
        },
        removeTitleItem(index) {
            this.item.titles.splice(index, 1);
        },
    },
};
</script>

<style scoped lang="scss" rel="stylesheet/scss">
.card-template {
    display: flex;
    border-bottom: solid #efefef 1px;
    &-info {
        margin-left: 10px;
    }
}
.preview-card {
    width: 250px;
    height: fit-content;
    margin: 15px;
    .title {
        font-size: 16px;
    }
    .logo {
        display: flex;
        align-items: center;
        font-size: 13px;
        color: #999999;
        line-height: 22px;
    }
}
.preview-image {
    width: 48px;
    height: 48px;
    margin-bottom: 15px;
}
.preview-info {
    display: flex;
    justify-content: space-between;
    margin-top: 5px;
    .content {
        width: 180px;
        font-size: 14px;
        color: gray;
        line-height: 18px;
    }
}
.logo-icon-bottom {
    width: 14px;
    height: 14px;
    margin-right: 5px;
}
.image-demand {
    display: inline-block;
    color: #9aa9bf;
    left: 260px;
    font-size: 12px;
    line-height: 20px;
}
.title-input-wrap {
    display: flex;
    align-items: center;
    .opreate-input {
        width: 300px;
    }
    .operate-icon {
        margin-left: 10px;
    }
}
</style>

```
分享口令
```vue
<template>
    <div class="card-template">
        <div>
            <div class="image-demand">分享口令格式：</div>
            <div class="pwtext">1{{ item.titles[0] }}❤️复制整条信息，打开👉美团👈 http:/💰57MzMxZWM1YTg💰</div>
            <div class="image-demand">口令解析弹窗：</div>
            <el-card class="preview-card" :body-style="{ padding: '0px 0px 8px 0px' }">
                <xx-image
                    :src="item.imageUrl || 'https://p1.meituan.net/travelcube/83e12caec292d279dd182e42e1be65d212623.png'"
                    fit="cover"
                    class="preview-image"
                ></xx-image>
                <div class="logo">
                    <img src="https://p0.meituan.net/travelcube/830874b89a254e47dd39a97c7c9c914a3744.jpg" class="logo-icon" />
                    <div>美团优选 果蔬内禽蛋日用百货</div>
                </div>
                <div class="title">{{ item.titles[0] }}</div>
                <div class="btn">立即打开</div>
            </el-card>
        </div>
        <div class="card-template-info">
            <h4 class="row-header">分享配置</h4>
            <el-form-item label="分享标题" :rules="formRules.titles" :prop="propPath">
                <div v-for="(titleitem, index) in item.titles" :key="index" class="title-input-wrap">
                    <el-input v-model="item.titles[index]" :maxlength="30" class="opreate-input" :disabled="disabled"></el-input>
                    <i v-if="!disabled && item.titles.length > 1" class="el-icon-delete operate-icon" @click="removeTitleItem(index)"></i>
                    <i v-if="!disabled && index === item.titles.length - 1" class="el-icon-plus operate-icon" @click="addTitleItem"></i>
                </div>
            </el-form-item>
            <el-form-item label="分享图片" :rules="formRules.imageUrl" :prop="propPath">
                <image-upload v-model="item.imageUrl" mode="single" :validate-rule="imgValidateRule"></image-upload>
                <span class="image-demand">图片宽度不高于750且不低于320，图片大小不超过512KB，支持格式jpg/png/jpeg</span>
            </el-form-item>
            <!-- <el-form-item v-if="isTemplate" label="分享路径" :rules="formRules.url" :prop="propPath">
                <path-picker v-model="item.url" :disabled="disabled" :shareScene="shareScene" :type="type" mode="share" />
            </el-form-item> -->
            <el-row v-if="isTemplate">
                <el-col :span="14">
                    <el-form-item label="模版ID">
                        <el-input v-model="item.extAttributes.pwTemplateKey" :maxlength="10"></el-input>
                    </el-form-item>
                </el-col>
                <el-col :span="10">
                    <el-form-item label="模版Index">
                        <el-input v-model="item.extAttributes.pwTemplateIndex" :maxlength="2"></el-input>
                    </el-form-item>
                </el-col>
                <shareBtnConfig :item="item" />
            </el-row>
            <template v-if="isTemplate">
                <h4 class="row-header">弹窗配置</h4>
                <el-form-item label="步骤图" :rules="imageValidate('stepsImg', '步骤图')" :prop="propPath">
                    <image-upload v-model="item.extAttributes.stepsImg" mode="single" :validate-rule="stepsImgValidateRule"></image-upload>
                    <span class="image-demand">图片宽度488/高度87，图片大小不超过100KB，支持格式jpg/png/jpeg</span>
                </el-form-item>
                <el-form-item label="提示图" :rules="imageValidate('promptImg', '提示图')" :prop="propPath">
                    <image-upload v-model="item.extAttributes.promptImg" mode="single" :validate-rule="promptImgValidateRule"></image-upload>
                    <span class="image-demand">图片宽度492/高度248，图片大小不超过1M，支持格式jpg/png/jpeg/gif</span>
                </el-form-item>
            </template>
            <!-- <el-form-item label="分享路径" prop="backFlowChannel">
                <el-radio-group v-model="item.backFlowChannel" size="small">
                    <el-radio-button label="1">优选App</el-radio-button>
                    <el-radio-button label="2">优选微信小程序</el-radio-button>
                    <el-radio-button label="3">美团App</el-radio-button>
                    <el-radio-button label="4">美团微信小程序</el-radio-button>
                </el-radio-group>
            </el-form-item> -->
        </div>
    </div>
</template>

<script>
import ImageUpload from 'projects/promotion-base/src/components/image-upload/image-upload.vue';
import base from './base';
import { getShareChannelName } from '../utils';

const imgValidateRule = {
    maxWidth: 750,
    minWidth: 320,
    maxSize: 512,
    picFormat: ['png', 'jpg', 'jpeg'],
};

const stepsImgValidateRule = {
    width: 488,
    height: 87,
    maxSize: 100,
    picFormat: ['png', 'jpg', 'jpeg'],
}

const promptImgValidateRule = {
    maxSize: 1024,
    width: 492,
    height: 248,
    picFormat: ['png', 'jpg', 'jpeg', 'gif'],
}

export default {
    components: {
        ImageUpload,
    },
    extends: base,
    props: {
        shareScene: {
            type: Number,
        },
        type: {
            type: Number,
        },
    },
    data: function () {
        return {
            imgValidateRule,
            stepsImgValidateRule,
            promptImgValidateRule
        };
    },
    methods: {
        addTitleItem() {
            this.item.titles.push('');
        },
        removeTitleItem(index) {
            this.item.titles.splice(index, 1);
        },
        imageValidate(key, label) {
            return [{
                required: true,
                validator: (r, v, cb)=> {
                    const channelLabel = getShareChannelName(v.type)
                    if (!v.extAttributes[key]) {
                        cb(new Error(`${channelLabel}${label}为空`))
                    } else {
                        cb()
                    }
                },
                trigger: ['blur', 'change'],
            }]
        }
    },
};
</script>

<style scoped lang="scss" rel="stylesheet/scss">
.card-template {
    display: flex;
    border-bottom: solid #efefef 1px;
    &-info {
        margin-left: 10px;
    }
}
.pwtext {
    max-width: 300px;
    margin: 10px 15px;
}
.preview-card {
    width: 250px;
    margin: 5px 10px 10px 10px;
    .preview-image {
        width: 248px;
        height: 248px;
    }
    .logo {
        margin-left: 10px;
        display: flex;
        align-items: center;
        font-size: 13px;
        color: #999999;
        line-height: 22px;
    }
    .logo-icon {
        width: 20px;
        height: 20px;
        margin-right: 5px;
    }
    .title {
        font-size: 14px;
        font-weight: bold;
        padding: 5px 10px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
    .btn {
        width: 220px;
        line-height: 34px;
        background: #ffd100;
        text-align: center;
        font-size: 14px;
        font-weight: bold;
        border-radius: 8px;
        margin: 5px auto;
    }
}
.image-demand {
    display: inline-block;
    color: #9aa9bf;
    left: 260px;
    font-size: 12px;
    line-height: 20px;
}
.title-input-wrap {
    display: flex;
    align-items: center;
    .opreate-input {
        width: 300px;
    }
    .operate-icon {
        margin-left: 10px;
    }
}
</style>

```
二维码
```vue
<template>
    <div class="card-template">
        <el-card class="preview-card" :body-style="{ padding: '0px' }">
            <div class="preview-wrap">
                <xx-image
                    :src="item.imageUrl || 'https://p0.meituan.net/travelcube/466be7eff04a53c87d97a7847c18c55e189234.png'"
                    fit="cover"
                    class="preview-image"
                ></xx-image>
                <div class="title">{{ item.titles[0] }}</div>
                <div class="subtitle">{{ item.text }}</div>
                <img class="qrcode-image" :src="qrUrl" />
            </div>
        </el-card>
        <div class="card-template-info">
            <el-form-item label="分享标题" :rules="formRules.titles" :prop="propPath">
                <div v-for="(titleitem, index) in item.titles" :key="index" class="title-input-wrap">
                    <el-input v-model="item.titles[index]" :maxlength="30" class="opreate-input" :disabled="disabled"></el-input>
                    <i v-if="!disabled && item.titles.length > 1" class="el-icon-delete operate-icon" @click="removeTitleItem(index)"></i>
                    <i v-if="!disabled && index === item.titles.length - 1" class="el-icon-plus operate-icon" @click="addTitleItem"></i>
                </div>
            </el-form-item>
            <el-form-item label="分享内容" :rules="formRules.text" :prop="propPath">
                <el-input v-model="item.text" :maxlength="30" class="opreate-input" :disabled="disabled"></el-input>
            </el-form-item>
            <el-form-item label="分享图片" :rules="formRules.imageUrl" :prop="propPath">
                <image-upload v-model="item.imageUrl" mode="single" :validate-rule="imgValidateRule" :disabled="disabled"></image-upload>
                <span class="image-demand">图片宽度不高于750且不低于320，图片大小不超过512KB，支持格式jpg/png/jpeg</span>
            </el-form-item>
            <template v-if="isTemplate">
                <!-- <el-form-item label="分享路径" :rules="formRules.url" :prop="propPath">
                    <path-picker v-model="item.url" :disabled="disabled" :shareScene="shareScene" :type="type" mode="share" />
                </el-form-item> -->
                <shareBtnConfig :item="item" />
            </template>
            <span class="image-demand">
                面对面背景图目前只可配置App端背景图片，微信渠道目前为固定图片，
                <a herf="https://p0.meituan.net/travelcube/466be7eff04a53c87d97a7847c18c55e189234.png">点击查看</a>
            </span>
            <!-- <el-form-item v-if="isTemplate" label="分享路径" prop="backFlowChannel">
                <el-radio-group v-model="item.backFlowChannel" size="small">
                    <el-radio-button label="1">优选App</el-radio-button>
                    <el-radio-button label="2">优选微信小程序</el-radio-button>
                    <el-radio-button label="3">美团App</el-radio-button>
                    <el-radio-button label="4">美团微信小程序</el-radio-button>
                </el-radio-group>
            </el-form-item> -->
        </div>
    </div>
</template>
<script>
import qrcode from 'jr-qrcode';
import ImageUpload from 'projects/promotion-base/src/components/image-upload/image-upload.vue';
import base from './base';

const imgValidateRule = {
    maxWidth: 1080,
    minWidth: 320,
    maxSize: 512,
    picFormat: ['png', 'jpg', 'jpeg'],
};

export default {
    components: {
        ImageUpload,
    },
    extends: base,
    props: {
        shareScene: {
            type: Number,
        },
        type: {
            type: Number,
        },
    },
    data: function () {
        return {
            imgValidateRule,
            qrUrl: '',
        };
    },
    watch: {
        'item.url': function (newVal) {
            this.generateQrcode(newVal);
        },
    },
    mounted() {
        this.generateQrcode(this.item.url);
    },
    methods: {
        addTitleItem() {
            this.item.titles.push('');
        },
        removeTitleItem(index) {
            this.item.titles.splice(index, 1);
        },
        generateQrcode(url) {
            if (!url) {
                return null;
            }
            this.qrUrl = qrcode.getQrBase64(url, {
                padding: 5,
                width: 100,
                height: 100,
                correctLevel: 1,
                reverse: false,
                background: '#ffffff',
                foreground: '#000000',
            });
        },
    },
};
</script>

<style scoped lang="scss" rel="stylesheet/scss">
.card-template {
    display: flex;
    padding-bottom: 20px;
    border-bottom: solid #efefef 1px;
    &-info {
        margin-left: 10px;
    }
}
.preview-card {
    width: 310px;
    margin: 15px;
    .preview-wrap {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .title {
        width: 100%;
        position: absolute;
        top: 0;
        left: 0;
        margin-top: 30px;
        font-size: 19px;
        color: #FFFFFF;
        text-align: center;
        line-height: 19px;
        font-weight: 700;
    }
    .subtitle {
        width: 100%;
        position: absolute;
        top: 0;
        left: 0;
        margin-top: 55px;
        font-size: 16px;
        color: #FFFFFF;
        text-align: center;
        line-height: 17px;
        font-weight: 700;
    }
    .preview-image {
        position: absolute;
        top: 0;
        left: 0;
    }
    .qrcode-image {
        margin-top: 80px;
        overflow: hidden;
        z-index: 2;
    }
}

.image-demand {
    display: inline-block;
    color: #9aa9bf;
    left: 260px;
    font-size: 12px;
    line-height: 20px;
}
.title-input-wrap {
    display: flex;
    align-items: center;
    .opreate-input {
        width: 300px;
    }
    .operate-icon {
        margin-left: 10px;
    }
}
</style>

```

导出不同的配置
```vue
<script>
import wxCard from './wxcard';
import password from './password';
import h5Card from './h5card';
import qrcode from './qrcode';
import poster from './poster';
import shortlink from './shortlink';

const typeMap = {
    1: 'wxCard',
    2: 'password',
    3: 'poster',
    5: 'h5Card',
    6: 'qrcode',
    7: 'shortlink',
};

export default {
    name: 'moduleTemplate',
    components: {
        wxCard,
        password,
        h5Card,
        qrcode,
        poster,
        shortlink,
    },
    props: {
        type: {
            type: Number,
            required: true,
        },
    },

    render(h) {
        return h(typeMap[this.type], {
            props: {
                ...this.$attrs,
                type: this.type,
            },
        });
    },
};
</script>

```

继承了base
base
```js
import { formRules } from '../utils';
import shareBtnConfig from './components/shareBtnConfig';

export default {
  props: {
    item: {
        type: Object,
        default: function () {
            return {
              titles: [''],
              imageUrl: '',
              url: '',
              extAttributes: {
                isOptional: true
              }
            };
        },
    },
    disabled: {
        type: [Boolean],
        default: function () {
            return false;
        },
    },
    isTemplate: {
        type: Boolean,
        default: function () {
            return false;
        },
    },
    index: {
      type: Number,
      default: 0,
    }
  },
  components: {
    shareBtnConfig
  },
  data() {
    return {
      formRules,
      propPath: `shareConfigs.${this.index}`
    };
  }
};

```
shareBtnConfig
```vue
<template>
  <div>
     <el-form-item label="是否选配" prop="isOptional">
        <el-radio v-model="item.extAttributes.isOptional" :label="true">是</el-radio>
        <el-radio v-model="item.extAttributes.isOptional" :label="false">否</el-radio>
    </el-form-item>
    <el-form-item  label="分享面板标题" prop="shareBtnTitle">
        <el-input v-model="item.extAttributes.shareBtnTitle" :maxlength="-1"></el-input>
    </el-form-item>
  </div>
</template>

<script>

export default {
  props: {
    item: {
        type: Object,
        default: function () {
            return {                  
               extAttributes: {
               }
            }
        },
    },
  }
}
</script>

<style scoped lang="scss" rel="stylesheet/scss">
</style>

```

## ab测试
```vue
<template>
    <el-collapse>
        <el-collapse-item class="abConfig" name="1">
            <template slot="title"> ab实验配置</template>
            <div class="attention-words">注意：实验保存后，更改实验配置，会新建实验</div>
            <div class="array-item">
                <el-collapse v-for="(abTest, expGroupIndex) in abTestGroup" :key="abTest.groupKey">
                    <el-collapse-item>
                        <template slot="title">
                            <div class="array-item-header">
                                <div class="index-icon">{{ expGroupIndex + 1 }}</div>
                                <div
                                    class="delete-icon el-icon-circle-close"
                                    @click="delExpGroup(abTest.groupKey)"
                                ></div>
                            </div>
                        </template>

                        <el-form :inline="true" label-width="70px" label-position="left">
                            <el-form-item label="分流方式" class="diversionType">
                                <el-radio-group v-model="abTest.diversionType">
                                    <el-radio :label="1">userid分流</el-radio>
                                    <el-radio :label="2">uuid分流</el-radio>
                                </el-radio-group>
                            </el-form-item>
                        </el-form>
                        <el-form :inline="true" label-width="70px" label-position="left">
                            <el-form-item label="实验名称">
                                <el-input
                                    v-model="abTest.groupName"
                                    placeholder="请输入实验名称"
                                ></el-input>
                            </el-form-item>
                            <el-form-item label="实验key">
                                <el-input
                                    v-model="abTest.groupKey"
                                    placeholder="实验key"
                                    :disabled="true"
                                ></el-input>
                            </el-form-item>
                        </el-form>
                        <div
                            class="experimentList"
                            v-for="(experiment, experimentIndex) in abTest.experimentList"
                            :key="experimentIndex"
                        >
                            <el-form :inline="true" label-width="70px" label-position="left">
                                <el-form-item :label="experimentLabels[experimentIndex].name">
                                    <el-input
                                        v-model="experiment.experimentName"
                                        placeholder="请对桶进行命名"
                                    ></el-input>
                                </el-form-item>
                                <el-form-item :label="experimentLabels[experimentIndex].ratio">
                                    <el-input
                                        v-model="experiment.experimentScale"
                                        @change="
                                            (val) => parseToInt(val, expGroupIndex, experimentIndex)
                                        "
                                        placeholder="请设置比例"
                                    ></el-input>
                                </el-form-item>
                                <i
                                    v-if="isShowIcon(abTest, experimentIndex)"
                                    class="el-icon-circle-plus-outline icon"
                                    @click="addExperiment(expGroupIndex)"
                                ></i>
                                <i
                                    class="el-icon-delete icon"
                                    @click="delExperiment({ expGroupIndex, experimentIndex })"
                                ></i>
                            </el-form>
                            <el-form>
                                <el-form-item label="选择组件">
                                    <xx-select
                                        v-model="experiment.selectedComponent"
                                        :list="compList"
                                        :clearable="true"
                                        multiple
                                        filterable
                                    ></xx-select>
                                </el-form-item>
                            </el-form>
                        </div>
                    </el-collapse-item>
                </el-collapse>
            </div>

            <div class="abTestBtn">
                <el-button type="primary" plain @click="addExpGroup()">增加一组</el-button>
            </div>
        </el-collapse-item>
    </el-collapse>
</template>

<script>
import { cloneDeep, find, differenceWith, isEqual, sum } from 'lodash';

// 生成桶名
const experimentLabels = [...Array(26).keys()].map((index) => {
    const letter = String.fromCharCode(index + 65);
    const name = letter + '桶';
    const ratio = letter + '桶比例';
    return {
        name,
        ratio,
    };
});

export default {
    data() {
        return {
            delAbTestGroup: [],
            abTestGroup: [],
            // 实验场景Id
            sceneId: null,
            maxGroupKeyId: 0,
            experimentLabels,
            // 每次查询得到的实验组
            oriAbTestGroup: [],
        };
    },
    props: {
        tree: Object,
    },
    computed: {
        compList() {
            const nodeList = this.tree?.nodeList || []
            return nodeList.map((node, index) => {
                return {
                    label: `${index + 1}号-${node.componentName}`,
                    value: node.nodeId,
                };
            });
        },
    },
    methods: {
        parseToInt(val, expGroupIndex, experimentIndex) {
            this.abTestGroup[expGroupIndex].experimentList[experimentIndex].experimentScale =
                Math.floor(Number(val));
        },
        isShowIcon(abTest, experimentIndex) {
            return abTest.experimentList.length - 1 === experimentIndex;
        },
        addExperiment(expGroupIndex) {
            const newExperiment = {
                experimentName: '',
                experimentScale: null,
                selectedComponent: [],
            };
            this.abTestGroup[expGroupIndex].experimentList.push(newExperiment);
        },
        delExperiment(delParam) {
            const { experimentIndex, expGroupIndex } = delParam;
            if (this.abTestGroup[expGroupIndex].experimentList.length === 1) {
                this.$message.error('至少保留一个桶');
                return;
            }
            this.abTestGroup[expGroupIndex].experimentList.splice(experimentIndex, 1);
        },
        addExpGroup() {
            const groupKeyId = this.getMaxGroupKeyId() + 1;
            const groupKey = 'Arktest' + groupKeyId;
            const newTest = {
                diversionType: '',
                groupName: '',
                groupKey,
                groupId: null,
                experimentList: [
                    {
                        experimentName: '',
                        experimentScale: '',
                        selectedComponent: [],
                    },
                ],
            };
            this.abTestGroup.push(newTest);
        },
        delExpGroup(groupKey) {
            // 删除的实验组
            const delAbTestGroup = this.abTestGroup
                .filter((abTest) => {
                    return abTest.groupKey === groupKey && abTest.groupId;
                })
                .map((abTest) => {
                    // 标识删除的实验组
                    abTest.deleteOp = true;
                    return abTest;
                });
            this.delAbTestGroup.push(...delAbTestGroup);

            this.abTestGroup = this.abTestGroup.filter((abTest) => {
                return abTest.groupKey !== groupKey;
            });
        },
        getMaxGroupKeyId() {
            const abTestGroupLen = this.abTestGroup.length;
            const rexgNum = /[^0-9]/gi;
            let curMaxGroupKeyId = 0;
            if (abTestGroupLen > 0) {
                curMaxGroupKeyId = Number(
                    this.abTestGroup[abTestGroupLen - 1].groupKey.replace(rexgNum, '')
                );
            }
            return Math.max(curMaxGroupKeyId, this.maxGroupKeyId);
        },
        //初始化abTest
        abTestQuery(pageMixId) {
            this.$hGet('/api/m/mkt/ark/v2/queryExperiment', {
                pageMixId,
            })
                .then((res) => {
                    this.abTestGroup = res.groupList;
                    this.maxGroupKeyId = res.maxGroupKeyId;
                    this.sceneId = res.sceneId;
                    this.oriAbTestGroup = cloneDeep(res.groupList);
                })
                .catch((e) => {
                    console.error('abTest Query Failed', e);
                });
        },
        abTestInit(pageMixId) {
            return this.$hPost('/api/m/mkt/ark/v2/addExperimentScene', {
                pageMixId,
                groupList: this.abTestGroup,
            })
            .then(() => true)
            .catch((e) => {
                console.error('abTest Update Failed', e);
                return false;
            });
        },
        //abTest更新
        abTestUpdate(pageMixId) {
            const abTestGroupDiff = differenceWith(this.abTestGroup, this.oriAbTestGroup, isEqual);

            this.addGroupKeyId(abTestGroupDiff);
            const updateGroupConfigList = [...abTestGroupDiff, ...this.delAbTestGroup];
            if (updateGroupConfigList.length > 0) {
                return this.$hPost('/api/m/mkt/ark/v2/updateExperimentGroup', {
                    sceneId: this.sceneId,
                    pageMixId,
                    updateGroupConfigList,
                })
                .then(() => true)
                .catch((e) => {
                    console.error('abTest Update Failed', e);
                    return false;
                });
            }
            return true;
        },
        addGroupKeyId(abTestGroup) {
            const maxGroupKeyId = this.getMaxGroupKeyId();
            let tmpGroupKeyId = maxGroupKeyId;
            this.abTestGroup.map((abTest) => {
                if (find(abTestGroup, abTest) && abTest.groupId !== null) {
                    tmpGroupKeyId += 1;
                    abTest.groupKey = 'Arktest' + tmpGroupKeyId;
                }
            });
        },
        async abTestSave(pageMixId) {
            if (this.abTestGroup.length > 0 || this.delAbTestGroup.length > 0) {
                if (this.sceneId) {
                    const res = await this.abTestUpdate(pageMixId);
                    return res;
                } else {
                    const res = await this.abTestInit(pageMixId);
                    return res;
                }
            }
            return true;
        },
        abTestValidate() {
            const fixedScale = 100;
            let abTestGroupIndex = 0;
            const isAbScaleValid = this.abTestGroup.every((abTest, index) => {
                const { diversionType, groupName, experimentList } = abTest;
                if (!diversionType) {
                    this.$message.error(`${index + 1}号实验未选择分流方式，请选择`);
                    return false;
                }
                if (!groupName) {
                    this.$message.error(`${index + 1}号实验未填写实验名称，请填写`);
                    return false;
                }
                const experimentScales = experimentList.map((experiment) => {
                    return Number(experiment.experimentScale);
                });
                const totalScale = sum(experimentScales);
                if (totalScale === fixedScale) {
                    return true;
                } else {
                    abTestGroupIndex = index;
                    this.$message.error(`${abTestGroupIndex + 1}号实验分桶比例之和不为100`);
                    return false;
                }
            });
            return {
                isAbScaleValid,
                abTestGroupIndex,
            };
        },
        getAbGroups() {
          return _.cloneDeep(this.abTestGroup);
        }
    },
};
</script>
```

